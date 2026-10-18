import { Loader, Stack, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { monitor } from '../../lib/monitor'
import { buscarTudo, type Publicacao } from './feed'
import { ListaDoFeed } from './ListaDoFeed'

// O usuário vai ler as 10 primeiras, mas a API manda todas: resposta pesada,
// banco lendo a tabela inteira e a tela travada desenhando milhares de cartões.
export function SemPaginacao() {
  const [itens, setItens] = useState<Publicacao[]>()

  useEffect(() => {
    buscarTudo().then((resposta) => {
      setItens(resposta)
      monitor.tela(`${resposta.length} publicações de uma vez`)
    })
  }, [])

  if (!itens) return <Loader />

  return (
    <Stack>
      <Text fw={600}>{itens.length.toLocaleString('pt-BR')} publicações carregadas de uma vez</Text>
      <ListaDoFeed itens={itens} />
    </Stack>
  )
}
