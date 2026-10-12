import { Badge, Card, Group, Rating, Stack, Text, Title } from '@mantine/core'
import { formatarPreco } from '../../lib/produtos'

export type Vendedor = { id: number; nome: string; cidade: string }
export type Comentario = { id: number; autor: string; texto: string; nota: number }

type Props = {
  nome: string
  categoria: string
  precoCentavos: number
  vendedor: Vendedor
  comentarios: Comentario[]
}

// A parte visual é igual nas duas versões; muda só o jeito de buscar os dados.
export function TelaDoProduto({ nome, categoria, precoCentavos, vendedor, comentarios }: Props) {
  return (
    <Stack>
      <Group>
        <Title order={3}>{nome}</Title>
        <Badge variant="light" color="gray">
          {categoria}
        </Badge>
      </Group>
      <Text size="xl" fw={700}>
        {formatarPreco(precoCentavos)}
      </Text>
      <Text c="dimmed">
        Vendido por {vendedor.nome} ({vendedor.cidade})
      </Text>

      <Title order={4} mt="md">
        {comentarios.length} comentários
      </Title>
      {comentarios.map((comentario) => (
        <Card key={comentario.id} withBorder padding="sm">
          <Group justify="space-between">
            <Text fw={600}>{comentario.autor}</Text>
            <Rating value={comentario.nota} readOnly size="sm" />
          </Group>
          <Text size="sm">{comentario.texto}</Text>
        </Card>
      ))}
    </Stack>
  )
}
