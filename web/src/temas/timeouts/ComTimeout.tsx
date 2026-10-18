import { Alert, Button, Center, Loader, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { ListaDeProdutos } from '../../componentes/ListaDeProdutos'
import { monitor } from '../../lib/monitor'
import { buscarProdutos, type Produto } from '../../lib/produtos'

// Nielsen: depois de 10s o usuário já foi fazer outra coisa. Desistir antes disso é melhor que girar sem fim.
const LIMITE_EM_MS = 5000

export function ComTimeout() {
  const [produtos, setProdutos] = useState<Produto[]>()
  const [erro, setErro] = useState<string>()

  async function carregar() {
    setProdutos(undefined)
    setErro(undefined)
    monitor.tela('spinner')
    try {
      // Depois de 5s, o navegador cancela a request e o fetch falha com um TimeoutError.
      setProdutos(await buscarProdutos({}, AbortSignal.timeout(LIMITE_EM_MS)))
      monitor.tela('lista')
    } catch (falha) {
      // Diz o que aconteceu: demorar demais é diferente de dar erro.
      setErro(
        falha instanceof Error && falha.name === 'TimeoutError'
          ? 'O servidor está demorando mais que o normal.'
          : 'Não foi possível carregar os produtos.',
      )
      monitor.tela('desistiu + Tentar de novo')
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  if (erro) {
    return (
      <Alert color="orange" title={erro}>
        <Text size="sm" mb="sm">
          Pode ser instabilidade. Tente de novo em alguns instantes.
        </Text>
        <Button color="orange" variant="light" onClick={carregar}>
          Tentar de novo
        </Button>
      </Alert>
    )
  }

  if (!produtos) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    )
  }

  return <ListaDeProdutos produtos={produtos} />
}
