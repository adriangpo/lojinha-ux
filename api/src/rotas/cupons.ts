import { Router, type NextFunction, type Request, type Response } from 'express'

const CUPONS: Record<string, number> = { BEMVINDO10: 10, FRETEGRATIS: 15 }

// Limitador de janela fixa: cada IP pode fazer MAXIMO requests a cada JANELA.
// Em memória para a demo; com vários servidores, a contagem iria para o Redis.
const MAXIMO = 5
const JANELA = 10_000
const contagens = new Map<string, { quantidade: number; zeraEm: number }>()

function limitar(req: Request, res: Response, next: NextFunction) {
  const agora = Date.now()
  const chave = req.ip ?? 'desconhecido'

  // Primeira request do IP, ou a janela anterior já acabou: começa a contar de novo.
  let contagem = contagens.get(chave)
  if (!contagem || agora >= contagem.zeraEm) {
    contagem = { quantidade: 0, zeraEm: agora + JANELA }
    contagens.set(chave, contagem)
  }

  contagem.quantidade++
  const segundos = Math.ceil((contagem.zeraEm - agora) / 1000)

  // Cabeçalhos RateLimit-* (padrão da IETF): o cliente sabe quanto ainda pode antes de ser barrado.
  res.set('RateLimit-Limit', String(MAXIMO))
  res.set('RateLimit-Remaining', String(Math.max(0, MAXIMO - contagem.quantidade)))
  res.set('RateLimit-Reset', String(segundos))

  if (contagem.quantidade > MAXIMO) {
    // Retry-After diz ao cliente quantos segundos esperar, em vez de deixá-lo adivinhar.
    res.set('Retry-After', String(segundos))
    res.status(429).json({ erro: `Muitas tentativas. Tente novamente em ${segundos} segundos.` })
    return
  }

  next()
}

function validarCupom(req: Request, res: Response) {
  const codigo = String(req.body.codigo ?? '').trim().toUpperCase()
  const desconto = CUPONS[codigo]

  if (!desconto) {
    res.status(404).json({ erro: 'Cupom não encontrado' })
    return
  }
  res.json({ codigo, desconto })
}

export const rotasDeCupons = Router()

// POST /api/cupons/sem-limite  { codigo } - dá para testar mil códigos por segundo.
rotasDeCupons.post('/cupons/sem-limite', validarCupom)

// POST /api/cupons/com-limite  { codigo } - o mesmo, com o limitador na frente.
rotasDeCupons.post('/cupons/com-limite', limitar, validarCupom)
