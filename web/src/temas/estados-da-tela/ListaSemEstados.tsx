import { Stack } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { CampoDeBusca } from '../../componentes/CampoDeBusca'
import { ListaDeProdutos } from '../../componentes/ListaDeProdutos'
import { monitor } from '../../lib/monitor'
import { buscarProdutos } from '../../lib/produtos'

export function ListaSemEstados() {
  const [busca, setBusca] = useState('')

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos', 'busca', busca],
    queryFn: ({ signal }) => buscarProdutos({ busca }, signal),
    // Sem retries automáticos: eles são assunto de outro tema.
    retry: false,
  })

  // Carregando, erro e nenhum resultado dão na mesma tela: uma lista vazia.
  const vazia = produtos.length === 0
  useEffect(() => monitor.tela(vazia ? 'tela em branco' : 'lista'), [vazia])

  return (
    <Stack>
      <CampoDeBusca valor={busca} aoMudar={setBusca} />
      <ListaDeProdutos produtos={produtos} />
    </Stack>
  )
}
