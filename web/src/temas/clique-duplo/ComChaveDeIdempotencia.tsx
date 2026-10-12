import { Button, Stack, Text } from '@mantine/core'
import { useState } from 'react'
import { monitor } from '../../lib/monitor'
import { CartaoDoProduto } from './CartaoDoProduto'
import { comprar } from './pedidos'
import { TabelaDePedidos } from './TabelaDePedidos'

export function ComChaveDeIdempotencia() {
  const [atualizacao, setAtualizacao] = useState(0)
  // Uma chave por intenção de compra: todos os cliques desta compra mandam a mesma.
  const [chave, setChave] = useState(() => crypto.randomUUID())

  // O botão fica liberado de propósito, para mostrar que agora quem protege é a API.
  async function aoClicar() {
    monitor.marca('clicou em Comprar')
    const pedido = await comprar(chave)
    monitor.tela(`pedido #${pedido.id} confirmado`)
    setAtualizacao((n) => n + 1)
    // Compra concluída: a próxima compra é outra intenção, com outra chave.
    setChave(crypto.randomUUID())
  }

  return (
    <Stack gap="xl">
      <CartaoDoProduto>
        <Stack gap={4} align="end">
          <Button size="md" onClick={aoClicar}>
            Comprar
          </Button>
          <Text size="xs" c="dimmed">
            Chave: {chave.slice(0, 8)}
          </Text>
        </Stack>
      </CartaoDoProduto>
      <TabelaDePedidos atualizacao={atualizacao} />
    </Stack>
  )
}
