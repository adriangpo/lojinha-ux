import { Stack } from '@mantine/core'
import { useEffect, useState } from 'react'
import { CampoDeBusca } from '../../componentes/CampoDeBusca'
import { ListaDeProdutos } from '../../componentes/ListaDeProdutos'
import { useDebounce } from '../../hooks/useDebounce'
import { monitor } from '../../lib/monitor'
import { buscarProdutos, type Produto } from '../../lib/produtos'

export function BuscaComDebounce() {
  const [busca, setBusca] = useState('')
  const [produtos, setProdutos] = useState<Produto[]>([])

  // Só muda quando o usuário para de digitar por 400ms.
  const buscaComAtraso = useDebounce(busca, 400)

  // Agora a requisição depende de `buscaComAtraso`, não de cada tecla.
  // (As respostas ainda podem chegar fora de ordem: é o próximo tema.)
  useEffect(() => {
    buscarProdutos({ busca: buscaComAtraso }).then((dados) => {
      setProdutos(dados)
      monitor.tela(`lista de “${buscaComAtraso}”`)
    })
  }, [buscaComAtraso])

  return (
    <Stack>
      <CampoDeBusca valor={busca} aoMudar={setBusca} />
      <ListaDeProdutos produtos={produtos} />
    </Stack>
  )
}
