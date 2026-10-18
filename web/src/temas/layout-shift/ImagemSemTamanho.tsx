import { Alert, Button, Card, SimpleGrid, Stack, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { monitor } from '../../lib/monitor'
import { buscarProdutos, formatarPreco, type Produto } from '../../lib/produtos'

export function ImagemSemTamanho() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [clicado, setClicado] = useState<string>()
  // O navegador guarda na memória as imagens que a aba já mostrou (mesmo com no-store).
  // O ?visita= muda cada vez que a tela abre: as fotos vêm da API de novo, como numa primeira visita.
  const [visita] = useState(() => Date.now())

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
            {/* Sem tamanho: até a imagem chegar, ela ocupa 0px de altura.
                Quando chega, empurra o nome, o preço e o botão para baixo. */}
            <img
              src={`/api/imagens/${produto.id}?visita=${visita}`}
              alt={produto.nome}
              style={{ width: '100%' }}
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
