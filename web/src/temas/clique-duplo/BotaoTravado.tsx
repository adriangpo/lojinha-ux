import { Button, Stack } from '@mantine/core'
import { useState } from 'react'
import { monitor } from '../../lib/monitor'
import { CartaoDoProduto } from './CartaoDoProduto'
import { comprar } from './pedidos'
import { TabelaDePedidos } from './TabelaDePedidos'

export function BotaoTravado() {
  const [atualizacao, setAtualizacao] = useState(0)
  const [enviando, setEnviando] = useState(false)

  async function aoClicar() {
    monitor.marca('clicou em Comprar')
    setEnviando(true)
    monitor.tela('botão "Enviando…" travado')
    try {
      const pedido = await comprar()
      monitor.tela(`pedido #${pedido.id} confirmado`)
      setAtualizacao((n) => n + 1)
    } finally {
      // Libera o botão mesmo se der erro, senão o usuário fica preso.
      setEnviando(false)
    }
  }

  // Resolve na tela, mas a API continua sem proteção:
  // um retry automático ou uma rede instável ainda podem criar dois pedidos.
  return (
    <Stack gap="xl">
      <CartaoDoProduto>
        <Button size="md" onClick={aoClicar} disabled={enviando}>
          {enviando ? 'Enviando…' : 'Comprar'}
        </Button>
      </CartaoDoProduto>
      <TabelaDePedidos atualizacao={atualizacao} />
    </Stack>
  )
}
