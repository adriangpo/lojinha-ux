import { ActionIcon, Card, Group, SimpleGrid, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { buscarProdutos, formatarPreco, type Produto } from '../../lib/produtos'

export function FavoritarEsperando() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [favoritos, setFavoritos] = useState<number[]>([])

  useEffect(() => {
    buscarProdutos({ categoria: 'Eletrônicos' }).then((dados) => setProdutos(dados.slice(0, 6)))
    api<number[]>('/favoritos').then(setFavoritos)
  }, [])

  async function alternar(produto: Produto) {
    monitor.marca(`clicou no coração: ${produto.nome}`)
    const favoritar = !favoritos.includes(produto.id)

    // Espera a API responder para só então mudar o coração.
    // Com 2s de latência, são 2s de clique "sem efeito". E se falhar, nada acontece.
    await api(`/favoritos/${produto.id}`, { method: favoritar ? 'PUT' : 'DELETE' })
    setFavoritos((atuais) => (favoritar ? [...atuais, produto.id] : atuais.filter((id) => id !== produto.id)))
    monitor.tela(favoritar ? 'coração vermelho (só agora)' : 'coração vazio (só agora)')
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
      {produtos.map((produto) => {
        const favorito = favoritos.includes(produto.id)
        return (
          <Card key={produto.id} withBorder padding="md">
            <Group justify="space-between" wrap="nowrap">
              <Text fw={600}>{produto.nome}</Text>
              <ActionIcon
                variant="subtle"
                color="red"
                size="xl"
                aria-label="Favoritar"
                aria-pressed={favorito}
                onClick={() => alternar(produto)}
              >
                <Text component="span" size="xl">{favorito ? '♥' : '♡'}</Text>
              </ActionIcon>
            </Group>
            <Text size="lg" fw={700}>
              {formatarPreco(produto.precoCentavos)}
            </Text>
          </Card>
        )
      })}
    </SimpleGrid>
  )
}
