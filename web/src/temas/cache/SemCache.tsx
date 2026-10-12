import { Loader, Stack } from '@mantine/core'
import { useEffect, useState } from 'react'
import { ListaDeProdutos } from '../../componentes/ListaDeProdutos'
import { SeletorDeCategoria } from '../../componentes/SeletorDeCategoria'
import { buscarProdutos, CATEGORIAS, type Produto } from '../../lib/produtos'

export function SemCache() {
  const [categoria, setCategoria] = useState(CATEGORIAS[0])
  const [produtos, setProdutos] = useState<Produto[]>()

  // Toda troca de categoria apaga a lista e busca de novo,
  // mesmo que a gente tenha acabado de ver essa categoria.
  useEffect(() => {
    let ativo = true
    setProdutos(undefined)

    buscarProdutos({ categoria }).then((dados) => {
      if (ativo) setProdutos(dados)
    })

    // Trocou de categoria antes da resposta? Ignora a resposta antiga.
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
