import { Button, Stack, Text } from '@mantine/core'
import { useEffect, useRef, useState } from 'react'
import { ListaDeProdutos } from '../../componentes/ListaDeProdutos'
import { monitor } from '../../lib/monitor'
import { buscarProdutos, type Produto } from '../../lib/produtos'

export function RetrySemParar() {
  const [produtos, setProdutos] = useState<Produto[]>()
  const [tentativas, setTentativas] = useState(0)

  // Só para a demo: o laço para quando a gente troca de versão.
  const montado = useRef(true)
  useEffect(() => {
    return () => {
      montado.current = false
    }
  }, [])

  // Falhou? Tenta de novo na hora, para sempre.
  // Se a API está sobrecarregada, cada cliente vira uma metralhadora de requests e ela não volta nunca.
  async function carregar() {
    monitor.marca('clicou em Carregar')
    setProdutos(undefined)
    setTentativas(0)
    while (montado.current) {
      setTentativas((n) => n + 1)
      try {
        setProdutos(await buscarProdutos({ categoria: 'Livros' }))
        monitor.tela('produtos na tela')
        return
      } catch {
        // tenta de novo, sem esperar
      }
    }
  }

  return (
    <Stack>
      <Button onClick={carregar} w="fit-content">
        Carregar produtos
      </Button>
      {tentativas > 0 && <Text fw={600}>Tentativas: {tentativas}</Text>}
      {produtos && <ListaDeProdutos produtos={produtos} />}
    </Stack>
  )
}
