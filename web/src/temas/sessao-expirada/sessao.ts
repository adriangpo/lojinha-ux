import { api } from '../../lib/api'

export type Cadastro = Record<string, string>

// A sessão é um cookie httpOnly: o navegador manda sozinho em toda request.
export function entrar(email: string, senha: string) {
  return api('/login', { method: 'POST', corpo: { email, senha } })
}

export function verificarSessao() {
  return api('/sessao')
}

export function salvarCadastro(cadastro: Cadastro) {
  return api<{ mensagem: string }>('/cadastros', { method: 'POST', corpo: cadastro })
}
