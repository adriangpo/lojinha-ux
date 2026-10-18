import { api } from '../../lib/api'
import { monitor } from '../../lib/monitor'

export type Publicacao = { id: number; texto: string }

export function buscarTudo() {
  return api<Publicacao[]>('/feed/tudo')
}

export function buscarPorPagina(pagina: number) {
  return api<{ itens: Publicacao[]; totalDePaginas: number }>(`/feed/offset?pagina=${pagina}`)
}

export function buscarDepoisDe(cursor: number | null) {
  const parametro = cursor === null ? '' : `?depoisDe=${cursor}`
  return api<{ itens: Publicacao[]; proximoCursor: number | null }>(`/feed/cursor${parametro}`)
}

// Simula outra pessoa publicando enquanto o usuário rola a lista.
export function publicarAlgoNovo() {
  monitor.marca('alguém publicou')
  return api<Publicacao>('/feed', { method: 'POST' })
}
