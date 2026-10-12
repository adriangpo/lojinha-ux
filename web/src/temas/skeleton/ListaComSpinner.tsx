import { Center, Loader, Stack } from '@mantine/core'
import { useEffect, useState } from 'react'
import { ListaDeProdutos } from '../../componentes/ListaDeProdutos'
import { SeletorDeCategoria } from '../../componentes/SeletorDeCategoria'
import { monitor } from '../../lib/monitor'
import { buscarProdutos, CATEGORIAS, type Produto } from '../../lib/produtos'

export function ListaComSpinner() {
  const [categoria, setCategoria] = useState(CATEGORIAS[0])
  const [produtos, setProdutos] = useState<Produto[]>()

  useEffect(() => {
    let ativo = true
    setProdutos(undefined)
    monitor.tela('spinner')

    buscarProdutos({ categoria }).then((dados) => {
      if (!ativo) return
      setProdutos(dados)
      monitor.tela('lista')
    })

    return () => {
      ativo = false
    }
  }, [categoria])

  return (
    <Stack>
      <SeletorDeCategoria valor={categoria} aoMudar={setCategoria} />
      {/* Um spinner sozinho na tela vazia: não diz o que vem nem quanto falta. */}
      {produtos ? (
        <ListaDeProdutos produtos={produtos} />
      ) : (
        <Center h={300}>
          <Loader />
        </Center>
      )}
    </Stack>
  )
}
