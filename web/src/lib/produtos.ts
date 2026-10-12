import { api } from './api'

export type Produto = {
  id: number
  nome: string
  categoria: string
  precoCentavos: number
}

export const CATEGORIAS = ['Eletrônicos', 'Livros', 'Casa', 'Esporte', 'Games']

type Filtros = {
  busca?: string
  categoria?: string
}

export function buscarProdutos(filtros: Filtros, signal?: AbortSignal) {
  const parametros = new URLSearchParams()
  if (filtros.busca) parametros.set('busca', filtros.busca)
  if (filtros.categoria) parametros.set('categoria', filtros.categoria)

  return api<Produto[]>(`/produtos?${parametros}`, { signal })
}

export function formatarPreco(centavos: number) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
