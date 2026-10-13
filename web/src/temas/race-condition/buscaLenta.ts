import { api } from '../../lib/api'
import type { Produto } from '../../lib/produtos'

// A mesma busca de produtos, numa rota em que busca curta demora mais (ver api/rotas/produtos.ts).
export function buscarComDemora(busca: string, signal?: AbortSignal) {
  return api<Produto[]>(`/busca-lenta?busca=${encodeURIComponent(busca)}`, { signal })
}
