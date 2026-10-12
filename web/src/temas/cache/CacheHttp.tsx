import { Loader, Stack } from '@mantine/core'
import { useEffect, useState } from 'react'
import { ListaDeProdutos } from '../../componentes/ListaDeProdutos'
import { SeletorDeCategoria } from '../../componentes/SeletorDeCategoria'
import { api } from '../../lib/api'
import { CATEGORIAS, type Produto } from '../../lib/produtos'

// O código do front é igual ao "Sem cache". Quem decide o cache aqui é a API,
// pelos cabeçalhos Cache-Control e ETag (api/src/rotas/cache-http.ts).
export function CacheHttp() {
  const [categoria, setCategoria] = useState(CATEGORIAS[0])
  const [produtos, setProdutos] = useState<Produto[]>()

  useEffect(() => {
    let ativo = true
    setProdutos(undefined)

    api<Produto[]>(`/produtos-com-cache?categoria=${encodeURIComponent(categoria)}`).then((dados) => {
      if (ativo) setProdutos(dados)
    })

    return () => {
      ativo = false
    }
  }, [categoria])

  return (
    <Stack>
      <SeletorDeCategoria valor={categoria} aoMudar={setCategoria} />
      {produtos ? <ListaDeProdutos produtos={produtos} /> : <Loader />}
    </Stack>
  )
}
