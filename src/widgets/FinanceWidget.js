import { Text, VStack, HStack, Spacer } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type FinanceWidgetProps = {
  balance: string;
  expenses: string;
  income: string;
  pendingBoletos: number;
  nextInvoice: string;
  nextInvoiceValue: string;
  currencySymbol: string;
};

const FinanceWidget = (props: FinanceWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  const isDark = environment.colorScheme === 'dark';
  const accentColor = isDark ? '#34D399' : '#10B981';
  const dangerColor = isDark ? '#F87171' : '#EF4444';
  const textColor = isDark ? '#FFFFFF' : '#1F2937';
  const subTextColor = isDark ? '#9CA3AF' : '#6B7280';

  const { widgetFamily } = environment;

  // SMALL WIDGET (2x2)
  if (widgetFamily === 'systemSmall') {
    return (
      <VStack
        modifiers={[
          padding({ all: 12 }),
          frame({ minWidth: 0, maxWidth: 'infinity', minHeight: 0, maxHeight: 'infinity' })
        ]}
      >
        <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle(subTextColor)]}>
          Saldo
        </Text>
        <Text modifiers={[font({ size: 20, weight: 'bold' }), foregroundStyle(textColor)]}>
          {props.currencySymbol}{props.balance}
        </Text>
        <Spacer />
        <HStack>
          <VStack>
            <Text modifiers={[font({ size: 9 }), foregroundStyle(subTextColor)]}>
              Despesas
            </Text>
            <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(dangerColor)]}>
              {props.currencySymbol}{props.expenses}
            </Text>
          </VStack>
          <Spacer />
          <VStack alignment="trailing">
            <Text modifiers={[font({ size: 9 }), foregroundStyle(subTextColor)]}>
              Receitas
            </Text>
            <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(accentColor)]}>
              {props.currencySymbol}{props.income}
            </Text>
          </VStack>
        </HStack>
      </VStack>
    );
  }

  // MEDIUM WIDGET (4x2) - default
  if (widgetFamily === 'systemMedium') {
    return (
      <VStack
        modifiers={[
          padding({ all: 16 }),
          frame({ minWidth: 0, maxWidth: 'infinity', minHeight: 0, maxHeight: 'infinity' })
        ]}
      >
        <HStack>
          <VStack>
            <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(subTextColor)]}>
              Saldo Atual
            </Text>
            <Text modifiers={[font({ size: 24, weight: 'bold' }), foregroundStyle(textColor)]}>
              {props.currencySymbol}{props.balance}
            </Text>
          </VStack>
          <Spacer />
          {props.pendingBoletos > 0 && (
            <VStack alignment="trailing">
              <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle(dangerColor)]}>
                {props.pendingBoletos} boleto{props.pendingBoletos > 1 ? 's' : ''} pendente{props.pendingBoletos > 1 ? 's' : ''}
              </Text>
            </VStack>
          )}
        </HStack>

        <Spacer />

        <HStack>
          <VStack>
            <Text modifiers={[font({ size: 11 }), foregroundStyle(subTextColor)]}>
              Despesas
            </Text>
            <Text modifiers={[font({ size: 16, weight: 'semibold' }), foregroundStyle(dangerColor)]}>
              {props.currencySymbol}{props.expenses}
            </Text>
          </VStack>

          <Spacer />

          <VStack>
            <Text modifiers={[font({ size: 11 }), foregroundStyle(subTextColor)]}>
              Receitas
            </Text>
            <Text modifiers={[font({ size: 16, weight: 'semibold' }), foregroundStyle(accentColor)]}>
              {props.currencySymbol}{props.income}
            </Text>
          </VStack>

          <Spacer />

          <VStack alignment="trailing">
            <Text modifiers={[font({ size: 11 }), foregroundStyle(subTextColor)]}>
              Próx. Fatura
            </Text>
            <Text modifiers={[font({ size: 16, weight: 'semibold' }), foregroundStyle(textColor)]}>
              {props.currencySymbol}{props.nextInvoiceValue}
            </Text>
            <Text modifiers={[font({ size: 10 }), foregroundStyle(subTextColor)]}>
              {props.nextInvoice}
            </Text>
          </VStack>
        </HStack>
      </VStack>
    );
  }

  // LARGE WIDGET (4x4)
  return (
    <VStack
      modifiers={[
        padding({ all: 20 }),
        frame({ minWidth: 0, maxWidth: 'infinity', minHeight: 0, maxHeight: 'infinity' })
      ]}
    >
      <HStack>
        <VStack>
          <Text modifiers={[font({ size: 14, weight: 'medium' }), foregroundStyle(subTextColor)]}>
            Saldo Atual
          </Text>
          <Text modifiers={[font({ size: 32, weight: 'bold' }), foregroundStyle(textColor)]}>
            {props.currencySymbol}{props.balance}
          </Text>
        </VStack>
        <Spacer />
        <VStack alignment="trailing">
          <Text modifiers={[font({ size: 12 }), foregroundStyle(subTextColor)]}>
            SmartExpense
          </Text>
        </VStack>
      </HStack>

      <Spacer />

      <HStack>
        <VStack>
          <Text modifiers={[font({ size: 12 }), foregroundStyle(subTextColor)]}>
            Receitas
          </Text>
          <Text modifiers={[font({ size: 20, weight: 'semibold' }), foregroundStyle(accentColor)]}>
            {props.currencySymbol}{props.income}
          </Text>
        </VStack>
        <Spacer />
        <VStack>
          <Text modifiers={[font({ size: 12 }), foregroundStyle(subTextColor)]}>
            Despesas
          </Text>
          <Text modifiers={[font({ size: 20, weight: 'semibold' }), foregroundStyle(dangerColor)]}>
            {props.currencySymbol}{props.expenses}
          </Text>
        </VStack>
        <Spacer />
        <VStack alignment="trailing">
          <Text modifiers={[font({ size: 12 }), foregroundStyle(subTextColor)]}>
            Próx. Fatura
          </Text>
          <Text modifiers={[font({ size: 20, weight: 'semibold' }), foregroundStyle(textColor)]}>
            {props.currencySymbol}{props.nextInvoiceValue}
          </Text>
          <Text modifiers={[font({ size: 11 }), foregroundStyle(subTextColor)]}>
            {props.nextInvoice}
          </Text>
        </VStack>
      </HStack>

      <Spacer />

      {props.pendingBoletos > 0 && (
        <HStack>
          <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(dangerColor)]}>
            ⚠️ {props.pendingBoletos} boleto{props.pendingBoletos > 1 ? 's' : ''} pendente{props.pendingBoletos > 1 ? 's' : ''}
          </Text>
          <Spacer />
        </HStack>
      )}
    </VStack>
  );
};

export default createWidget('FinanceWidget', FinanceWidget);