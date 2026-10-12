import { Badge, Card, SimpleGrid, Text } from '@mantine/core'
import { formatarPreco, type Produto } from '../lib/produtos'

export function ListaDeProdutos({ produtos }: { produtos: Produto[] }) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
      {produtos.map((produto) => (
        <Card key={produto.id} withBorder padding="md">
          <Text fw={600}>{produto.nome}</Text>
          <Badge variant="light" color="gray" mt={6}>
            {produto.categoria}
          </Badge>
          <Text size="lg" fw={700} mt="sm">
            {formatarPreco(produto.precoCentavos)}
          </Text>
        </Card>
      ))}
    </SimpleGrid>
  )
}
