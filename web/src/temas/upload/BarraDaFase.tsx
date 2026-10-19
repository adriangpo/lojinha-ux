import { Group, Progress, Stack, Text } from '@mantine/core'

type Props = {
  titulo: string
  valor: number
  legenda: string
  // Sem porcentagem para mostrar: listras andando, "está acontecendo, mas não sei quanto falta".
  indeterminada?: boolean
}

export function BarraDaFase({ titulo, valor, legenda, indeterminada = false }: Props) {
  return (
    <Stack gap={4}>
      <Group justify="space-between">
        <Text fw={600}>{titulo}</Text>
        <Text size="sm" c="dimmed">
          {legenda}
        </Text>
      </Group>
      <Progress
        value={indeterminada ? 100 : valor}
        striped={indeterminada}
        animated={indeterminada}
        size="xl"
        color={indeterminada ? 'gray' : valor === 100 ? 'green' : 'blue'}
      />
    </Stack>
  )
}
