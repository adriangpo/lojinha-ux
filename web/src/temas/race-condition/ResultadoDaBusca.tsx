import { Stack, Text } from '@mantine/core'
import { ListaDeProdutos } from '../../componentes/ListaDeProdutos'
import type { Produto } from '../../lib/produtos'

export type Resultado = {
  busca: string
  produtos: Produto[]
}

type Props = {
  digitado: string
  resultado?: Resultado
}

// Mostra para qual busca são os resultados, e fica vermelho quando não bate com o que foi digitado.
export function ResultadoDaBusca({ digitado, resultado }: Props) {
  if (!resultado) return null

  const bate = resultado.busca === digitado

  return (
    <Stack>
      <Text size="lg" fw={600} c={bate ? 'green.8' : 'red.7'}>
        {resultado.busca ? `Resultados para “${resultado.busca}”` : 'Todos os produtos'}
      </Text>
      <ListaDeProdutos produtos={resultado.produtos} />
    </Stack>
  )
}
