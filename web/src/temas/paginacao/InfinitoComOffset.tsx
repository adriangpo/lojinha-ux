import { Loader, Stack, Text } from '@mantine/core'
import { useInViewport } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import { monitor } from '../../lib/monitor'
import { buscarPorPagina, type Publicacao } from './feed'
import { ListaDoFeed } from './ListaDoFeed'

export function InfinitoComOffset() {
  const [itens, setItens] = useState<Publicacao[]>([])
  const [proximaPagina, setProximaPagina] = useState(1)
  const [acabou, setAcabou] = useState(false)
  const [carregando, setCarregando] = useState(false)

  // `ref` vai num elemento no fim da lista: quando ele aparece na tela, carrega mais.
  const { ref, inViewport } = useInViewport()

  useEffect(() => {
    if (!inViewport || carregando || acabou) return

    setCarregando(true)
    buscarPorPagina(proximaPagina).then((resposta) => {
      // A página 2 é "pule 10". Se alguém publicou no topo, o item 10 virou o 11 e vem de novo.
      setItens((anteriores) => [...anteriores, ...resposta.itens])
      monitor.tela(`+${resposta.itens.length} itens (página ${proximaPagina})`)
      setProximaPagina(proximaPagina + 1)
      setAcabou(proximaPagina >= resposta.totalDePaginas)
      setCarregando(false)
    })
  }, [inViewport, carregando, acabou, proximaPagina])

  return (
    <Stack>
      <ListaDoFeed itens={itens} />
      <div ref={ref}>{acabou ? <Text c="dimmed">Fim da lista</Text> : <Loader />}</div>
    </Stack>
  )
}
