import { Group, Progress, Stack, Text } from '@mantine/core'

type Props = {
  titulo: string
  valor: number
  legenda: string
}

export function BarraDaFase({ titulo, valor, legenda }: Props) {
  return (
    <Stack gap={4}>
      <Group justify="space-between">
        <Text fw={600}>{titulo}</Text>
        <Text size="sm" c="dimmed">
          {legenda}
        </Text>
      </Group>
      <Progress value={valor} size="xl" color={valor === 100 ? 'green' : 'blue'} />
    </Stack>
  )
}
