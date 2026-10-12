import { Alert, Button, Card, SimpleGrid, Stack, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { monitor } from '../../lib/monitor'
import { buscarProdutos, formatarPreco, type Produto } from '../../lib/produtos'

export function ImagemComEspacoReservado() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [clicado, setClicado] = useState<string>()

  useEffect(() => {
    buscarProdutos({ categoria: 'Eletrônicos' }).then((dados) => setProdutos(dados.slice(0, 6)))
  }, [])

  function comprar(produto: Produto) {
    monitor.marca(`clicou em Comprar: ${produto.nome}`)
    setClicado(produto.nome)
  }

  return (
    <Stack>
      <Alert color={clicado ? 'blue' : 'gray'}>Você clicou em: {clicado ?? 'nada ainda'}</Alert>

      <SimpleGrid cols={3}>
        {produtos.map((produto) => (
          <Card key={produto.id} withBorder padding="md">
            {/* width e height dizem a proporção (4:3) antes da imagem chegar:
                o navegador já reserva o espaço e nada se mexe quando ela carrega.
                (Mesmo efeito: style={{ aspectRatio: '4 / 3' }}.) */}
            <img
              src={`/api/imagens/${produto.id}`}
              alt={produto.nome}
              width={640}
              height={480}
              style={{ width: '100%', height: 'auto', background: 'var(--mantine-color-gray-1)' }}
              onLoad={() => monitor.tela(`imagem de ${produto.nome} apareceu`)}
            />
            <Text fw={600} mt="sm">
              {produto.nome}
            </Text>
            <Text fw={700}>{formatarPreco(produto.precoCentavos)}</Text>
            <Button mt="sm" onClick={() => comprar(produto)}>
              Comprar
            </Button>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  )
}
