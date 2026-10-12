import { api } from '../../lib/api'

export type Pedido = {
  id: number
  produto: string
  chave: string | null
  criadoEm: string
}

export const PRODUTO = { id: 1, nome: 'Fone de ouvido Bluetooth', precoCentavos: 18990 }

// A chave é opcional: só a versão "Chave de idempotência" manda.
export function comprar(chave?: string) {
  return api<{ id: number }>('/pedidos', {
    method: 'POST',
    corpo: { produtoId: PRODUTO.id },
    headers: chave ? { 'Idempotency-Key': chave } : undefined,
  })
}

export function listarPedidos() {
  return api<Pedido[]>('/pedidos')
}

export function limparPedidos() {
  return api('/pedidos', { method: 'DELETE' })
}
