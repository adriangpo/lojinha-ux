import { api } from '../../lib/api'
import type { Produto } from '../../lib/produtos'

// Devolve quantos itens o carrinho tem depois de adicionar.
export function adicionarAoCarrinho(produto: Produto) {
  return api<{ itens: number }>('/carrinho', { method: 'POST', corpo: { produtoId: produto.id } })
}
