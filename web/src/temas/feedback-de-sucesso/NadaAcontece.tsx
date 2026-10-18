import { monitor } from '../../lib/monitor'
import type { Produto } from '../../lib/produtos'
import { adicionarAoCarrinho } from './carrinho'
import { VitrineDoCarrinho } from './VitrineDoCarrinho'

export function NadaAcontece() {
  // Deu certo, mas a tela não diz isso: o usuário fica sem saber e clica de novo.
  async function adicionar(produto: Produto) {
    await adicionarAoCarrinho(produto)
    monitor.tela('nada mudou na tela')
  }

  return <VitrineDoCarrinho aoAdicionar={adicionar} />
}
