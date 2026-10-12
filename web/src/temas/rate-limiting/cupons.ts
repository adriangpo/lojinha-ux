import { api } from '../../lib/api'

export type Mensagem = { cor: string; texto: string }

// Mesma validação de cupom, em duas rotas: uma sem limite e outra com o limitador na frente.
export function aplicarCupom(rota: 'sem-limite' | 'com-limite', codigo: string) {
  return api<{ codigo: string; desconto: number }>(`/cupons/${rota}`, { method: 'POST', corpo: { codigo } })
}
