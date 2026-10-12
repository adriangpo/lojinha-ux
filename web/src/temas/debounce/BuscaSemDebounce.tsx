import { Stack } from '@mantine/core'
import { useEffect, useState } from 'react'
import { CampoDeBusca } from '../../componentes/CampoDeBusca'
import { ListaDeProdutos } from '../../componentes/ListaDeProdutos'
import { monitor } from '../../lib/monitor'
import { buscarProdutos, type Produto } from '../../lib/produtos'

export function BuscaSemDebounce() {
  const [busca, setBusca] = useState('')
  const [produtos, setProdutos] = useState<Produto[]>([])

  // Cada tecla muda `busca`, e cada mudança dispara uma requisição.
  useEffect(() => {
    buscarProdutos({ busca }).then((dados) => {
      setProdutos(dados)
      monitor.tela(`lista de “${busca}”`)
    })
  }, [busca])

  return (
    <Stack>
      <CampoDeBusca valor={busca} aoMudar={setBusca} />
      <ListaDeProdutos produtos={produtos} />
    </Stack>
  )
}
