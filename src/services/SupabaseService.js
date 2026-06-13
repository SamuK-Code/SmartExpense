import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// SUPABASE SERVICE - SINCRONIZAÇÃO REAL P2P
// ============================================
// 
// 1. Crie conta gratuita em: https://supabase.com
// 2. Crie um projeto
// 3. Vá em Settings > API > URL e anon key
// 4. Cole abaixo:
//
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'sua-anon-key-aqui';

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
  }

  // ========== HTTP HELPERS ==========
  async _get(endpoint) {
    const res = await fetch(`${this.baseUrl}/rest/v1/${endpoint}`, {
      method: 'GET',
      headers: this.headers,
    });
    if (!res.ok) throw new Error(`GET ${endpoint}: ${res.status}`);
    return res.json();
  }

  async _post(endpoint, body) {
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
  }

  async _patch(endpoint, body) {
    const res = await fetch(`${this.baseUrl}/rest/v1/${endpoint}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PATCH ${endpoint}: ${res.status}`);
    return res.json();
  }

  async _delete(endpoint) {
    const res = await fetch(`${this.baseUrl}/rest/v1/${endpoint}`, {
      method: 'DELETE',
      headers: this.headers,
    });
    if (!res.ok) throw new Error(`DELETE ${endpoint}: ${res.status}`);
    return true;
  }

  // ========== GRUPOS ==========
  async createGroup(name, description, userId, username, displayName) {
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
  }

  async joinGroup(inviteCode, userId, username, displayName) {
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
  }

  async getGroupMembers(groupId) {
    return this._get(`group_members?group_id=eq.${groupId}&select=*`);
  }

  async getUserGroups(userId) {
    const members = await this._get(`group_members?user_id=eq.${userId}&select=group_id,role,joined_at,groups(*)`);
    return members.map(m => ({
      ...m.groups,
      memberRole: m.role,
      joinedAt: m.joined_at,
    }));
  }

  async leaveGroup(groupId, userId) {
    await this._delete(`group_members?group_id=eq.${groupId}&user_id=eq.${userId}`);
    return { success: true };
  }

  // ========== SINCRONIZAÇÃO DE DADOS ==========
  async syncExpenses(groupId, expenses, userId) {
    // Deleta despesas antigas do usuário no grupo
    await this._delete(`group_expenses?group_id=eq.${groupId}&user_id=eq.${userId}`);

    // Insere despesas atualizadas
    if (expenses.length > 0) {
      const payload = expenses.map(e => ({
        group_id: groupId,
        user_id: userId,
        expense_data: e,
      }));
      await this._post('group_expenses', payload);
    }

    return { success: true };
  }

  async syncCards(groupId, cards, userId) {
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
  }

  async syncCategories(groupId, categories, userId) {
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
  }

  async syncCashTransactions(groupId, transactions, userId) {
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
  }

  // Busca todos os dados do grupo (de TODOS os membros)
  async fetchGroupData(groupId) {
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
  }

  // ========== REALTIME (WebSocket) ==========
  connectRealtime(groupId, onDataChange) {
    if (this.ws) {
      this.ws.close();
    }

    const wsUrl = this.baseUrl.replace('https://', 'wss://') + '/realtime/v1/websocket';

    this.ws = new WebSocket(wsUrl, ['realtime'], {
      headers: { apikey: this.apiKey },
    });

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
      const msg = JSON.parse(event.data);
      if (msg.type === 'INSERT' || msg.type === 'UPDATE' || msg.type === 'DELETE') {
        onDataChange(msg);
      }
    };

    this.ws.onerror = (error) => {
      console.error('[Supabase] Realtime erro:', error);
    };

    this.ws.onclose = () => {
      console.log('[Supabase] Realtime desconectado');
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        setTimeout(() => this.connectRealtime(groupId, onDataChange), 3000 * this.retryCount);
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
}

export default new SupabaseService();
