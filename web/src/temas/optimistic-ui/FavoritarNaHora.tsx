import { ActionIcon, Alert, Card, Group, SimpleGrid, Stack, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { buscarProdutos, formatarPreco, type Produto } from '../../lib/produtos'

export function FavoritarNaHora() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [favoritos, setFavoritos] = useState<number[]>([])
  const [aviso, setAviso] = useState<string>()

  useEffect(() => {
    buscarProdutos({ categoria: 'Eletrônicos' }).then((dados) => setProdutos(dados.slice(0, 6)))
    api<number[]>('/favoritos').then(setFavoritos)
  }, [])

  function marcar(id: number, favorito: boolean) {
    setFavoritos((atuais) => (favorito ? [...atuais, id] : atuais.filter((f) => f !== id)))
  }

  async function alternar(produto: Produto) {
    monitor.marca(`clicou no coração: ${produto.nome}`)
    const favoritar = !favoritos.includes(produto.id)

    // 1. Muda na hora, apostando que a API vai aceitar (quase sempre aceita).
    marcar(produto.id, favoritar)
    monitor.tela(favoritar ? 'coração vermelho na hora' : 'coração vazio na hora')
    setAviso(undefined)

    try {
      await api(`/favoritos/${produto.id}`, { method: favoritar ? 'PUT' : 'DELETE' })
    } catch {
      // 2. Não aceitou: desfaz e avisa. Voltar sem avisar seria pior que esperar.
      marcar(produto.id, !favoritar)
      setAviso(`Não foi possível ${favoritar ? 'favoritar' : 'desfavoritar'} “${produto.nome}”. Tente de novo.`)
      monitor.tela('coração voltou + aviso')
    }
  }

  return (
    <Stack>
      {aviso && (
        <Alert color="red" withCloseButton onClose={() => setAviso(undefined)}>
          {aviso}
        </Alert>
      )}

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
    </Stack>
  )
}
