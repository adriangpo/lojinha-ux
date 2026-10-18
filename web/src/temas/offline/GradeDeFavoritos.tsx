import { ActionIcon, Card, Group, SimpleGrid, Text } from '@mantine/core'
import { formatarPreco, type Produto } from '../../lib/produtos'

type Props = {
  produtos: Produto[]
  favoritos: number[]
  aoAlternar: (produto: Produto) => void
}

// Parte visual compartilhada: os produtos com o coração. Cada versão decide o que o clique faz.
export function GradeDeFavoritos({ produtos, favoritos, aoAlternar }: Props) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
      {produtos.map((produto) => {
        const favorito = favoritos.includes(produto.id)
        return (
          <Card key={produto.id} withBorder padding="md">
            <Group justify="space-between" wrap="nowrap">
              <Text fw={600}>{produto.nome}</Text>
              <ActionIcon
                variant="subtle"
                color="red"
                size="xl"
                aria-label="Favoritar"
                aria-pressed={favorito}
                onClick={() => aoAlternar(produto)}
              >
                <Text component="span" size="xl">{favorito ? '♥' : '♡'}</Text>
              </ActionIcon>
            </Group>
            <Text size="lg" fw={700}>
              {formatarPreco(produto.precoCentavos)}
            </Text>
          </Card>
        )
      })}
    </SimpleGrid>
  )
}
