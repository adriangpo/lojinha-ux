import { Badge, Button, Card, Group, Stack, Text } from '@mantine/core'
import { useEffect } from 'react'
import { monitor } from '../../lib/monitor'
import { publicarAlgoNovo, type Publicacao } from './feed'

// Parte visual compartilhada: marca em vermelho os itens que apareceram duas vezes.
export function ListaDoFeed({ itens }: { itens: Publicacao[] }) {
  const vezes = new Map<number, number>()
  for (const item of itens) vezes.set(item.id, (vezes.get(item.id) ?? 0) + 1)

  // Quantos itens aparecem duas vezes: o monitor avisa quando esse número muda.
  const repetidos = [...vezes.values()].filter((n) => n > 1).length
  useEffect(() => {
    if (repetidos > 0) monitor.tela(`item repetido apareceu (${repetidos} na tela)`)
  }, [repetidos])

  return (
    <Stack gap="xs">
      <Group>
        <Button variant="default" onClick={publicarAlgoNovo}>
          Simular: alguém publicou agora
        </Button>
      </Group>
      {itens.map((item, posicao) => {
        const repetido = (vezes.get(item.id) ?? 0) > 1
        // A key é a posição porque o mesmo id pode aparecer duas vezes (é o bug que a gente quer mostrar).
        return (
          <Card key={posicao} withBorder padding="sm" bg={repetido ? 'red.0' : undefined}>
            <Group justify="space-between">
              <Text>{item.texto}</Text>
              {repetido && <Badge color="red">Repetido</Badge>}
            </Group>
          </Card>
        )
      })}
    </Stack>
  )
}
