import { Alert, Button, Card, SimpleGrid, Stack, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { monitor } from '../../lib/monitor'
import { buscarProdutos, formatarPreco, type Produto } from '../../lib/produtos'

// Parte visual compartilhada: cada versão decide o que acontece depois que o produto entra no carrinho.
export function VitrineDoCarrinho({ aoAdicionar }: { aoAdicionar: (produto: Produto) => Promise<void> }) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [adicionando, setAdicionando] = useState<number>()
  const [erro, setErro] = useState<string>()

  useEffect(() => {
    buscarProdutos({ categoria: 'Esporte' }).then((dados) => setProdutos(dados.slice(0, 6)))
  }, [])

  async function adicionar(produto: Produto) {
    monitor.marca(`clicou em Adicionar: ${produto.nome}`)
    setAdicionando(produto.id)
    setErro(undefined)
    try {
      await aoAdicionar(produto)
    } catch {
      setErro(`Não foi possível adicionar “${produto.nome}”. Tente de novo.`)
    } finally {
      setAdicionando(undefined)
    }
  }

  return (
    <Stack>
      {erro && <Alert color="red">{erro}</Alert>}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        {produtos.map((produto) => (
          <Card key={produto.id} withBorder padding="md">
            <Text fw={600}>{produto.nome}</Text>
            <Text size="lg" fw={700} mb="sm">
              {formatarPreco(produto.precoCentavos)}
            </Text>
            <Button variant="light" loading={adicionando === produto.id} onClick={() => adicionar(produto)}>
              Adicionar ao carrinho
            </Button>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  )
}
