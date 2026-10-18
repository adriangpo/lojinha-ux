import { notifications } from '@mantine/notifications'
import { monitor } from '../../lib/monitor'
import type { Produto } from '../../lib/produtos'
import { adicionarAoCarrinho } from './carrinho'
import { VitrineDoCarrinho } from './VitrineDoCarrinho'

export function ComToast() {
  async function adicionar(produto: Produto) {
    const { itens } = await adicionarAoCarrinho(produto)
    // Confirma num cantinho, some sozinho em 3s e não trava nada: o usuário continua comprando.
    notifications.show({
      color: 'green',
      title: 'Adicionado ao carrinho',
      message: `${produto.nome} · ${itens} ${itens === 1 ? 'item' : 'itens'} no carrinho`,
      autoClose: 3000,
    })
    monitor.tela('toast discreto')
  }

  return <VitrineDoCarrinho aoAdicionar={adicionar} />
}
