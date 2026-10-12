import { Alert, Button, Stack } from '@mantine/core'
import { useState } from 'react'
import { ListaDeProdutos } from '../../componentes/ListaDeProdutos'
import { monitor } from '../../lib/monitor'
import { buscarProdutos, type Produto } from '../../lib/produtos'

export function SemRetry() {
  const [produtos, setProdutos] = useState<Produto[]>()
  const [erro, setErro] = useState<string>()

  // Uma falha passageira (um 503 que sumiria em 1 segundo) vira erro na cara do usuário.
  async function carregar() {
    monitor.marca('clicou em Carregar')
    setProdutos(undefined)
    setErro(undefined)
    try {
      setProdutos(await buscarProdutos({ categoria: 'Livros' }))
      monitor.tela('produtos na tela')
    } catch {
      setErro('Não foi possível carregar os produtos.')
      monitor.tela('erro na tela')
    }
  }

  return (
    <Stack>
      <Button onClick={carregar} w="fit-content">
        Carregar produtos
      </Button>
      {erro && <Alert color="red">{erro}</Alert>}
      {produtos && <ListaDeProdutos produtos={produtos} />}
    </Stack>
  )
}
