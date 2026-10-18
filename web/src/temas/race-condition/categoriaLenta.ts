import { api } from '../../lib/api'
import type { Produto } from '../../lib/produtos'

// Os produtos de uma categoria, numa rota em que Eletrônicos demora mais (ver api/rotas/produtos.ts).
export function buscarDaCategoria(categoria: string, signal?: AbortSignal) {
  return api<Produto[]>(`/categoria-lenta?categoria=${encodeURIComponent(categoria)}`, { signal })
}
