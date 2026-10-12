import { Button, Stack } from '@mantine/core'
import { useState } from 'react'
import { monitor } from '../../lib/monitor'
import { CartaoDoProduto } from './CartaoDoProduto'
import { comprar } from './pedidos'
import { TabelaDePedidos } from './TabelaDePedidos'

export function SemProtecao() {
  const [atualizacao, setAtualizacao] = useState(0)

  // O botão continua ativo durante o pagamento (1s sem resposta):
  // cada clique impaciente vira mais uma request, e cada request vira mais um pedido.
  async function aoClicar() {
    monitor.marca('clicou em Comprar')
    const pedido = await comprar()
    monitor.tela(`pedido #${pedido.id} confirmado`)
    setAtualizacao((n) => n + 1)
  }

  return (
    <Stack gap="xl">
      <CartaoDoProduto>
        <Button size="md" onClick={aoClicar}>
          Comprar
        </Button>
      </CartaoDoProduto>
      <TabelaDePedidos atualizacao={atualizacao} />
    </Stack>
  )
}
