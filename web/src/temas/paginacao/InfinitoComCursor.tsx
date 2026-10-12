import { Loader, Stack, Text } from '@mantine/core'
import { useInViewport } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import { monitor } from '../../lib/monitor'
import { buscarDepoisDe, type Publicacao } from './feed'
import { ListaDoFeed } from './ListaDoFeed'

export function InfinitoComCursor() {
  const [itens, setItens] = useState<Publicacao[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const [acabou, setAcabou] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const { ref, inViewport } = useInViewport()

  useEffect(() => {
    if (!inViewport || carregando || acabou) return

    setCarregando(true)
    buscarDepoisDe(cursor).then((resposta) => {
      // "Depois do item X" continua certo mesmo que alguém publique no topo.
      setItens((anteriores) => [...anteriores, ...resposta.itens])
      monitor.tela(`+${resposta.itens.length} itens (depois de ${cursor ?? 'o início'})`)
      setCursor(resposta.proximoCursor)
      setAcabou(resposta.proximoCursor === null)
      setCarregando(false)
    })
  }, [inViewport, carregando, acabou, cursor])

  return (
    <Stack>
      <ListaDoFeed itens={itens} />
      <div ref={ref}>{acabou ? <Text c="dimmed">Fim da lista</Text> : <Loader />}</div>
    </Stack>
  )
}
