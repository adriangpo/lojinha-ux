import { Router, type NextFunction, type Request, type Response } from 'express'
import { randomUUID } from 'node:crypto'

// Login de mentira: as sessões ficam em memória e o token vai num cookie.
const sessoes = new Set<string>()

// Chamado pelo botão "Expirar sessão agora" do painel do apresentador.
export function expirarSessoes() {
  sessoes.clear()
}

function lerToken(req: Request) {
  return req.get('cookie')?.match(/sessao=([^;]+)/)?.[1]
}

function exigirSessao(req: Request, res: Response, next: NextFunction) {
  const token = lerToken(req)
  if (!token || !sessoes.has(token)) {
    res.status(401).json({ erro: 'Sua sessão expirou. Entre de novo.' })
    return
  }
  next()
}

export const rotasDeSessao = Router()

// POST /api/login  { email, senha } — qualquer e-mail e senha preenchidos servem.
rotasDeSessao.post('/login', (req, res) => {
  if (!req.body.email || !req.body.senha) {
    res.status(400).json({ erro: 'Preencha e-mail e senha' })
    return
  }

  const token = randomUUID()
  sessoes.add(token)
  // httpOnly: o JavaScript da página não consegue ler o token.
  res.cookie('sessao', token, { httpOnly: true, sameSite: 'lax' })
  res.json({ ok: true })
})

// GET /api/sessao — a tela pergunta se ainda está logada.
rotasDeSessao.get('/sessao', exigirSessao, (_req, res) => {
  res.json({ ok: true })
})

// POST /api/cadastros  { ...campos } — só aceita com sessão válida.
rotasDeSessao.post('/cadastros', exigirSessao, (req, res) => {
  res.status(201).json({ mensagem: `Cadastro de ${req.body.nome} salvo!` })
})
