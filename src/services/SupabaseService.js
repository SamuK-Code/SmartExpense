import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// SUPABASE SERVICE - SINCRONIZAÇÃO
// ============================================
// 
// CONFIGURAÇÃO: Substitua os valores abaixo pelos seus do Supabase
// 1. Crie conta em: https://supabase.com
// 2. Novo projeto → Settings → API
// 3. Copie Project URL e anon/public key
//
const SUPABASE_URL = 'https://nrxkqhzrytzomvwqafiz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GnrhEybSIiLCS9iDd88z0g_pS_A0wsl';

// ============================================
// SCHEMA DO BANCO (rode no SQL Editor do Supabase):
// ============================================
/*
-- Tabela de grupos
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  settings JSONB DEFAULT '{"syncEnabled": true, "autoSync": true}'::jsonb
);

-- Tabela de membros
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Tabela de despesas compartilhadas
CREATE TABLE group_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username TEXT,
  expense_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de cartões compartilhados
CREATE TABLE group_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  card_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de categorias compartilhadas
CREATE TABLE group_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  category_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de transações em dinheiro
CREATE TABLE group_cash (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  transaction_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE group_expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE group_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE group_cash;

-- Políticas de segurança (RLS)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groups_select" ON groups FOR SELECT USING (true);
CREATE POLICY "groups_insert" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "groups_update" ON groups FOR UPDATE USING (true);

CREATE POLICY "members_select" ON group_members FOR SELECT USING (true);
CREATE POLICY "members_insert" ON group_members FOR INSERT WITH CHECK (true);

CREATE POLICY "expenses_select" ON group_expenses FOR SELECT USING (true);
CREATE POLICY "expenses_insert" ON group_expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "expenses_delete" ON group_expenses FOR DELETE USING (true);
*/

class SupabaseService {
  constructor() {
    this.baseUrl = SUPABASE_URL;
    this.apiKey = SUPABASE_ANON_KEY;
    this.headers = {
      'apikey': this.apiKey,
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };
    this.ws = null;
    this.listeners = [];
    this.retryCount = 0;
    this.maxRetries = 5;
    this.isConfigured = this._checkConfiguration();
  }

  // ========== CONFIG CHECK ==========
  _checkConfiguration() {
    const isDefaultUrl = this.baseUrl.includes('SEU-PROJETO') || this.baseUrl.includes('sua-anon-key');
    const isDefaultKey = this.apiKey.includes('sua-anon-key');
    
    if (isDefaultUrl || isDefaultKey) {
      console.warn('[Supabase] ⚠️  Configuração não definida! Substitua SUPABASE_URL e SUPABASE_ANON_KEY no arquivo SupabaseService.js');
      return false;
    }
    return true;
  }

  _ensureConfigured() {
    if (!this.isConfigured) {
      throw new Error('Supabase não configurado. Configure SUPABASE_URL e SUPABASE_ANON_KEY em src/services/SupabaseService.js');
    }
  }

  // ========== HTTP HELPERS ==========
  async _get(endpoint) {
    this._ensureConfigured();
    try {
      const res = await fetch(`${this.baseUrl}/rest/v1/${endpoint}`, {
        method: 'GET',
        headers: this.headers,
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`GET ${endpoint}: ${res.status} - ${errorText}`);
      }
      return res.json();
    } catch (error) {
      console.error('[Supabase] GET error:', error);
      throw error;
    }
  }

  async _post(endpoint, body) {
    this._ensureConfigured();
    try {
      const res = await fetch(`${this.baseUrl}/rest/v1/${endpoint}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`POST ${endpoint}: ${res.status} - ${text}`);
      }
      return res.json();
    } catch (error) {
      console.error('[Supabase] POST error:', error);
      throw error;
    }
  }

  async _patch(endpoint, body) {
    this._ensureConfigured();
    try {
      const res = await fetch(`${this.baseUrl}/rest/v1/${endpoint}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`PATCH ${endpoint}: ${res.status} - ${errorText}`);
      }
      return res.json();
    } catch (error) {
      console.error('[Supabase] PATCH error:', error);
      throw error;
    }
  }

  async _delete(endpoint) {
    this._ensureConfigured();
    try {
      const res = await fetch(`${this.baseUrl}/rest/v1/${endpoint}`, {
        method: 'DELETE',
        headers: this.headers,
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`DELETE ${endpoint}: ${res.status} - ${errorText}`);
      }
      return true;
    } catch (error) {
      console.error('[Supabase] DELETE error:', error);
      throw error;
    }
  }

  // ========== GRUPOS ==========
  async createGroup(name, description, userId, username, displayName) {
    try {
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      const [group] = await this._post('groups', {
        name,
        description,
        invite_code: inviteCode,
        created_by: userId,
      });

      await this._post('group_members', {
        group_id: group.id,
        user_id: userId,
        username,
        display_name: displayName,
        role: 'admin',
      });

      return { success: true, group };
    } catch (error) {
      console.error('[Supabase] createGroup error:', error);
      return { success: false, error: error.message };
    }
  }

  async joinGroup(inviteCode, userId, username, displayName) {
    try {
      const groups = await this._get(`groups?invite_code=eq.${inviteCode}`);
      if (!groups || groups.length === 0) {
        return { success: false, error: 'Código de convite inválido' };
      }

      const group = groups[0];

      // Verifica se já é membro
      const members = await this._get(`group_members?group_id=eq.${group.id}&user_id=eq.${userId}`);
      if (members && members.length > 0) {
        return { success: false, error: 'Você já é membro deste grupo' };
      }

      await this._post('group_members', {
        group_id: group.id,
        user_id: userId,
        username,
        display_name: displayName,
        role: 'member',
      });

      return { success: true, group };
    } catch (error) {
      console.error('[Supabase] joinGroup error:', error);
      return { success: false, error: error.message };
    }
  }

  async getGroupMembers(groupId) {
    try {
      return this._get(`group_members?group_id=eq.${groupId}&select=*`);
    } catch (error) {
      console.error('[Supabase] getGroupMembers error:', error);
      return [];
    }
  }

  async getUserGroups(userId) {
    try {
      const members = await this._get(`group_members?user_id=eq.${userId}&select=group_id,role,joined_at,groups(*)`);
      return members.map(m => ({
        ...m.groups,
        memberRole: m.role,
        joinedAt: m.joined_at,
      }));
    } catch (error) {
      console.error('[Supabase] getUserGroups error:', error);
      return [];
    }
  }

  async leaveGroup(groupId, userId) {
    try {
      await this._delete(`group_members?group_id=eq.${groupId}&user_id=eq.${userId}`);
      return { success: true };
    } catch (error) {
      console.error('[Supabase] leaveGroup error:', error);
      return { success: false, error: error.message };
    }
  }

  // ========== SINCRONIZAÇÃO DE DADOS ==========
  async syncExpenses(groupId, expenses, userId) {
    try {
      await this._delete(`group_expenses?group_id=eq.${groupId}&user_id=eq.${userId}`);

      if (expenses.length > 0) {
        const payload = expenses.map(e => ({
          group_id: groupId,
          user_id: userId,
          expense_data: e,
        }));
        await this._post('group_expenses', payload);
      }

      return { success: true };
    } catch (error) {
      console.error('[Supabase] syncExpenses error:', error);
      return { success: false, error: error.message };
    }
  }

  async syncCards(groupId, cards, userId) {
    try {
      await this._delete(`group_cards?group_id=eq.${groupId}&user_id=eq.${userId}`);

      if (cards.length > 0) {
        const payload = cards.map(c => ({
          group_id: groupId,
          user_id: userId,
          card_data: c,
        }));
        await this._post('group_cards', payload);
      }

      return { success: true };
    } catch (error) {
      console.error('[Supabase] syncCards error:', error);
      return { success: false, error: error.message };
    }
  }

  async syncCategories(groupId, categories, userId) {
    try {
      await this._delete(`group_categories?group_id=eq.${groupId}&user_id=eq.${userId}`);

      if (categories.length > 0) {
        const payload = categories.map(c => ({
          group_id: groupId,
          user_id: userId,
          category_data: c,
        }));
        await this._post('group_categories', payload);
      }

      return { success: true };
    } catch (error) {
      console.error('[Supabase] syncCategories error:', error);
      return { success: false, error: error.message };
    }
  }

  async syncCashTransactions(groupId, transactions, userId) {
    try {
      await this._delete(`group_cash?group_id=eq.${groupId}&user_id=eq.${userId}`);

      if (transactions.length > 0) {
        const payload = transactions.map(t => ({
          group_id: groupId,
          user_id: userId,
          transaction_data: t,
        }));
        await this._post('group_cash', payload);
      }

      return { success: true };
    } catch (error) {
      console.error('[Supabase] syncCashTransactions error:', error);
      return { success: false, error: error.message };
    }
  }

  // Busca todos os dados do grupo (de TODOS os membros)
  async fetchGroupData(groupId) {
    try {
      const [expenses, cards, categories, cash] = await Promise.all([
        this._get(`group_expenses?group_id=eq.${groupId}&select=expense_data,user_id,username`),
        this._get(`group_cards?group_id=eq.${groupId}&select=card_data,user_id`),
        this._get(`group_categories?group_id=eq.${groupId}&select=category_data,user_id`),
        this._get(`group_cash?group_id=eq.${groupId}&select=transaction_data,user_id`),
      ]);

      // Merge: mantém o mais recente quando há conflito de ID
      const mergeById = (items, dataKey) => {
        const map = new Map();
        items.forEach(item => {
          const data = item[dataKey];
          if (!data || !data.id) return;
          const existing = map.get(data.id);
          if (!existing || (data.updatedAt && existing.updatedAt < data.updatedAt)) {
            map.set(data.id, data);
          }
        });
        return Array.from(map.values());
      };

      return {
        success: true,
        data: {
          expenses: mergeById(expenses, 'expense_data'),
          cards: mergeById(cards, 'card_data'),
          categories: mergeById(categories, 'category_data'),
          cashTransactions: mergeById(cash, 'transaction_data'),
        },
      };
    } catch (error) {
      console.error('[Supabase] fetchGroupData error:', error);
      return { success: false, error: error.message };
    }
  }

  // ========== REALTIME (WebSocket) ==========
  connectRealtime(groupId, onDataChange) {
    if (!this.isConfigured) {
      console.warn('[Supabase] Realtime ignorado: Supabase não configurado');
      return;
    }

    if (this.ws) {
      this.ws.close();
    }

    // React Native WebSocket não aceita headers no construtor
    // Usamos query params para autenticação (padrão Supabase)
    const wsUrl = this.baseUrl.replace('https://', 'wss://') + `/realtime/v1/websocket?apikey=${this.apiKey}`;

    this.ws = new WebSocket(wsUrl, ['realtime']);

    this.ws.onopen = () => {
      console.log('[Supabase] Realtime conectado');
      this.retryCount = 0;

      // Subscribe na tabela group_expenses
      this.ws.send(JSON.stringify({
        type: 'phx_join',
        topic: `realtime:public:group_expenses:group_id=eq.${groupId}`,
        event: 'phx_join',
        payload: {},
        ref: '1',
      }));
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'INSERT' || msg.type === 'UPDATE' || msg.type === 'DELETE') {
          onDataChange(msg);
        }
      } catch (error) {
        console.error('[Supabase] Erro ao processar mensagem:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('[Supabase] Realtime erro:', error);
    };

    this.ws.onclose = () => {
      console.log('[Supabase] Realtime desconectado');
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = Math.min(3000 * this.retryCount, 30000); // Max 30s
        console.log(`[Supabase] Reconectando em ${delay}ms...`);
        setTimeout(() => this.connectRealtime(groupId, onDataChange), delay);
      }
    };
  }

  disconnectRealtime() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // ========== SYNC COMPLETO ==========
  async fullSync(groupId, localData, userId) {
    try {
      // Envia dados locais
      await Promise.all([
        this.syncExpenses(groupId, localData.expenses || [], userId),
        this.syncCards(groupId, localData.cards || [], userId),
        this.syncCategories(groupId, localData.categories || [], userId),
        this.syncCashTransactions(groupId, localData.cashTransactions || [], userId),
      ]);

      // Busca dados mesclados
      const result = await this.fetchGroupData(groupId);
      return result;
    } catch (error) {
      console.error('[Supabase] Erro no fullSync:', error);
      return { success: false, error: error.message };
    }
  }

  // ========== OFFLINE QUEUE ==========
  // Quando offline, salva operações para sync posterior
  async queueOperation(operation) {
    try {
      const queue = JSON.parse(await AsyncStorage.getItem('@supabase_sync_queue') || '[]');
      queue.push({
        ...operation,
        timestamp: Date.now(),
      });
      await AsyncStorage.setItem('@supabase_sync_queue', JSON.stringify(queue));
    } catch (error) {
      console.error('[Supabase] queueOperation error:', error);
    }
  }

  async processQueue() {
    try {
      const queue = JSON.parse(await AsyncStorage.getItem('@supabase_sync_queue') || '[]');
      if (queue.length === 0) return;

      console.log(`[Supabase] Processando ${queue.length} operações pendentes...`);
      
      // Processa e limpa a fila
      for (const op of queue) {
        // Implementar lógica de retry para cada operação
        console.log('[Supabase] Processando:', op);
      }

      await AsyncStorage.setItem('@supabase_sync_queue', '[]');
    } catch (error) {
      console.error('[Supabase] processQueue error:', error);
    }
  }
}

export default new SupabaseService();
