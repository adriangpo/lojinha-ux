import { Stack } from '@mantine/core'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { CampoDeBusca } from '../../componentes/CampoDeBusca'
import { ListaDeProdutos } from '../../componentes/ListaDeProdutos'
import { SeletorDeCategoria } from '../../componentes/SeletorDeCategoria'
import { monitor } from '../../lib/monitor'
import { buscarProdutos, CATEGORIAS } from '../../lib/produtos'

export function FiltrosNoEstado() {
  // Os filtros moram só na memória do componente: F5 ou link copiado volta tudo para o começo.
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS[0])

  // Ao abrir (ou dar F5): os filtros sempre começam do zero.
  useEffect(() => monitor.tela(`filtros do zero: “${busca}” em ${categoria}`), [])

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos', 'filtros', busca, categoria],
    queryFn: ({ signal }) => buscarProdutos({ busca, categoria }, signal),
    // Mantém a lista anterior na tela enquanto a nova chega.
    placeholderData: keepPreviousData,
  })

  return (
    <Stack>
      <CampoDeBusca valor={busca} aoMudar={setBusca} />
      <SeletorDeCategoria valor={categoria} aoMudar={setCategoria} />
      <ListaDeProdutos produtos={produtos} />
    </Stack>
  )
}
