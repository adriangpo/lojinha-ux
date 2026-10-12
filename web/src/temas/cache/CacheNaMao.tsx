import { Loader, Stack } from '@mantine/core'
import { useEffect, useState } from 'react'
import { ListaDeProdutos } from '../../componentes/ListaDeProdutos'
import { SeletorDeCategoria } from '../../componentes/SeletorDeCategoria'
import { monitor } from '../../lib/monitor'
import { buscarProdutos, CATEGORIAS, type Produto } from '../../lib/produtos'

// Fora do componente: o cache continua existindo quando o componente desmonta.
const cache = new Map<string, Produto[]>()

export function CacheNaMao() {
  const [categoria, setCategoria] = useState(CATEGORIAS[0])
  const [produtos, setProdutos] = useState<Produto[]>()

  useEffect(() => {
    let ativo = true

    // 1. Mostra na hora o que já está no cache (se ainda não tiver, mostra o loader).
    const guardados = cache.get(categoria)
    setProdutos(guardados)
    if (guardados) monitor.cache(`produtos de ${categoria}`)

    // 2. Busca a versão mais nova por trás e guarda no cache.
    buscarProdutos({ categoria }).then((dados) => {
      cache.set(categoria, dados)
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
