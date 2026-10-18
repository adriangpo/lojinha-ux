import { Alert, Center, Loader } from '@mantine/core'
import { useEffect, useState } from 'react'
import { ListaDeProdutos } from '../../componentes/ListaDeProdutos'
import { monitor } from '../../lib/monitor'
import { buscarProdutos, type Produto } from '../../lib/produtos'

export function EsperaParaSempre() {
  const [produtos, setProdutos] = useState<Produto[]>()
  const [erro, setErro] = useState(false)

  // O fetch não tem limite de tempo: se a API travar, ele espera para sempre, e o spinner também.
  useEffect(() => {
    monitor.tela('spinner')
    buscarProdutos({})
      .then((dados) => {
        setProdutos(dados)
        monitor.tela('lista (depois de quanto tempo?)')
      })
      .catch(() => setErro(true))
  }, [])

  if (erro) return <Alert color="red">Não foi possível carregar os produtos.</Alert>

  if (!produtos) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    )
  }

  return <ListaDeProdutos produtos={produtos} />
}
