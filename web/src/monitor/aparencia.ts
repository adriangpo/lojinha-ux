import type { Faixa } from '../lib/monitor'
import type { Trecho } from './useEventos'

export const FAIXAS: { faixa: Faixa; nome: string }[] = [
  { faixa: 'usuario', nome: 'Usuário' },
  { faixa: 'tela', nome: 'Tela' },
  { faixa: 'navegador', nome: 'Navegador' },
  { faixa: 'api', nome: 'API' },
  { faixa: 'banco', nome: 'Banco' },
]

export type Aparencia = { fundo: string; borda?: string; texto: string }

const cor = (nome: string) => `var(--mantine-color-${nome})`

// A cor diz como terminou: 2xx verde, 304 verde-água, 4xx laranja, 5xx vermelho.
export function aparenciaDoTrecho(trecho: Pick<Trecho, 'estilo' | 'resultado' | 'detalhe' | 'fim'>): Aparencia {
  if (trecho.estilo === 'espera') return { fundo: cor('gray-1'), borda: `2px dashed ${cor('gray-6')}`, texto: cor('gray-8') }
  if (trecho.estilo === 'cache') return { fundo: cor('teal-0'), borda: `2px dashed ${cor('teal-7')}`, texto: cor('teal-9') }
  if (trecho.fim === undefined) return { fundo: cor('blue-6'), texto: 'white' }
  if (trecho.resultado === 'cancelada') return { fundo: cor('gray-5'), texto: 'white' }

  const status = Number(trecho.detalhe)
  if (status === 304) return { fundo: cor('teal-6'), texto: 'white' }
  if (status >= 400 && status < 500) return { fundo: cor('orange-6'), texto: 'white' }
  if (trecho.resultado === 'erro') return { fundo: cor('red-6'), texto: 'white' }
  return { fundo: cor('green-6'), texto: 'white' }
}

export const LEGENDA: { nome: string; aparencia: Aparencia }[] = [
  { nome: 'Em andamento', aparencia: aparenciaDoTrecho({ fim: undefined }) },
  { nome: '2xx', aparencia: aparenciaDoTrecho({ fim: 1, resultado: 'ok' }) },
  { nome: '304', aparencia: aparenciaDoTrecho({ fim: 1, resultado: 'ok', detalhe: '304' }) },
  { nome: '4xx', aparencia: aparenciaDoTrecho({ fim: 1, resultado: 'erro', detalhe: '429' }) },
  { nome: '5xx / falha', aparencia: aparenciaDoTrecho({ fim: 1, resultado: 'erro', detalhe: '503' }) },
  { nome: 'Cancelada', aparencia: aparenciaDoTrecho({ fim: 1, resultado: 'cancelada' }) },
  { nome: 'Cache', aparencia: aparenciaDoTrecho({ estilo: 'cache' }) },
  { nome: 'Espera', aparencia: aparenciaDoTrecho({ estilo: 'espera' }) },
]

// Cor das marcas instantâneas, por faixa.
export const COR_DA_MARCA: Record<Faixa, string> = {
  usuario: cor('violet-6'),
  tela: cor('orange-7'),
  navegador: cor('teal-7'),
  api: cor('grape-6'),
  banco: cor('grape-6'),
}
