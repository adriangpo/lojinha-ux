import { Stack, Tabs, Text } from '@mantine/core'
import { ListaDeProdutos } from '../../componentes/ListaDeProdutos'
import { CATEGORIAS, type Produto } from '../../lib/produtos'

type Props = {
  categoria: string | null
  produtos: Produto[]
  aoEscolher: (categoria: string) => void
}

// As abas e a lista. O título diz de qual categoria os produtos são de verdade,
// e fica vermelho quando não bate com a aba escolhida.
export function AbasDeCategorias({ categoria, produtos, aoEscolher }: Props) {
  const daLista = produtos[0]?.categoria

  return (
    <Stack>
      <Tabs value={categoria} onChange={(valor) => valor && aoEscolher(valor)}>
        <Tabs.List>
          {CATEGORIAS.map((nome) => (
            <Tabs.Tab key={nome} value={nome}>
              {nome}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>
      {daLista && (
        <Text size="lg" fw={600} c={daLista === categoria ? 'green.8' : 'red.7'}>
          Produtos de {daLista}
        </Text>
      )}
      <ListaDeProdutos produtos={produtos} />
    </Stack>
  )
}
