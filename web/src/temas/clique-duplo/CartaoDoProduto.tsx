import { Card, Group, Text } from '@mantine/core'
import type { ReactNode } from 'react'
import { formatarPreco } from '../../lib/produtos'
import { PRODUTO } from './pedidos'

// O produto à venda; cada versão coloca o seu botão "Comprar" dentro.
export function CartaoDoProduto({ children }: { children: ReactNode }) {
  return (
    <Card withBorder padding="lg" maw={420}>
      <Group justify="space-between">
        <div>
          <Text fw={600}>{PRODUTO.nome}</Text>
          <Text size="xl" fw={700}>
            {formatarPreco(PRODUTO.precoCentavos)}
          </Text>
        </div>
        {children}
      </Group>
    </Card>
  )
}
