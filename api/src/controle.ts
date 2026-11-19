// Painel do apresentador: em localhost tudo responde na hora,
// então aqui a gente força as condições do mundo real.
import { Router, type NextFunction, type Request, type Response } from 'express'
import { expirarSessoes } from './rotas/sessao'
import { recomecarPeriodo } from './rotas/signed-url'

type Controle = {
  latencia: number | 'aleatoria'
  taxaDeErro: number
}

const controle: Controle = { latencia: 0, taxaDeErro: 0 }

export const rotasDeControle = Router()

rotasDeControle.get('/', (_req, res) => {
  res.json(controle)
})

rotasDeControle.put('/', (req, res) => {
  Object.assign(controle, req.body)
  res.json(controle)
})

// Botão "Expirar sessão agora" (tema Sessão expirada).
rotasDeControle.post('/expirar-sessoes', (_req, res) => {
  expirarSessoes()
  res.json({ ok: true })
})

// Botão "Esquecer URLs assinadas" (tema Imagens com signed URL): a próxima visita à versão
// "URL reaproveitada" recebe URLs novas e baixa as fotos de novo; as seguintes voltam a usar o cache.
rotasDeControle.post('/esquecer-urls-assinadas', (_req, res) => {
  recomecarPeriodo()
  res.json({ ok: true })
})

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms))

// Middleware: atrasa a resposta e, às vezes, falha de propósito.
export async function simularMundoReal(_req: Request, res: Response, next: NextFunction) {
  const latencia = controle.latencia === 'aleatoria' ? 200 + Math.random() * 1800 : controle.latencia
  await esperar(latencia)

  if (Math.random() * 100 < controle.taxaDeErro) {
    res.status(503).json({ erro: 'Serviço indisponível (simulado)' })
    return
  }

  next()
}
