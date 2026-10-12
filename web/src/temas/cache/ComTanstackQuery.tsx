import { Loader, Stack } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ListaDeProdutos } from '../../componentes/ListaDeProdutos'
import { SeletorDeCategoria } from '../../componentes/SeletorDeCategoria'
import { buscarProdutos, CATEGORIAS } from '../../lib/produtos'

export function ComTanstackQuery() {
  const [categoria, setCategoria] = useState(CATEGORIAS[0])

  const { data: produtos } = useQuery({
    // A chave identifica o dado no cache: cada categoria tem a sua.
    queryKey: ['produtos', categoria],
    queryFn: ({ signal }) => buscarProdutos({ categoria }, signal),
    // Por 10 segundos o dado é considerado fresco: nem busca de novo.
    staleTime: 10_000,
  })

  return (
    <Stack>
      <SeletorDeCategoria valor={categoria} aoMudar={setCategoria} />
      {produtos ? <ListaDeProdutos produtos={produtos} /> : <Loader />}
    </Stack>
  )
}
