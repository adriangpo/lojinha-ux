// Infraestrutura do monitor: avisa a aba /monitor de tudo o que acontece na API e no banco.
// Não faz parte das demos - as rotas não precisam saber que estão sendo observadas.
import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import { EventEmitter } from 'node:events'
import type { NextFunction, Request, Response } from 'express'

export type Faixa = 'navegador' | 'api' | 'banco'
export type Resultado = 'ok' | 'erro' | 'cancelada'

// O que o inspetor do monitor mostra quando se clica numa barra.
export type Detalhes = {
  status?: number
  cabecalhos?: Record<string, string>
  corpo?: string
}

// Mesmo formato de web/src/lib/monitor.ts.
export type EventoMonitor =
  | { tipo: 'inicio'; id: string; pai?: string; faixa: Faixa; rotulo: string; em: number; requisicao?: Detalhes }
  | { tipo: 'fim'; id: string; resultado: Resultado; detalhe?: string; em: number; resposta?: Detalhes }
  // Mensagem que o servidor empurra sem ninguém pedir (ex.: NOTIFY do Postgres chegando na API).
  | { tipo: 'aviso'; id: string; de: Faixa; para: Faixa; rotulo: string; em: number; trecho?: string }

const eventos = new EventEmitter()
eventos.setMaxListeners(0)

// Guarda o id da requisição atual para as consultas ao banco saberem a quem pertencem.
const requisicaoAtual = new AsyncLocalStorage<string>()

export function emitir(evento: EventoMonitor) {
  eventos.emit('evento', evento)
}

export function idDaRequisicaoAtual() {
  return requisicaoAtual.getStore()
}

// GET /api/monitor/eventos - a aba do monitor recebe todos os eventos por SSE.
export function transmitirEventos(req: Request, res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  res.write(': conectado\n\n')

  const enviar = (evento: EventoMonitor) => res.write(`data: ${JSON.stringify(evento)}\n\n`)
  eventos.on('evento', enviar)
  req.on('close', () => eventos.off('evento', enviar))
}

// Middleware: registra o início e o fim de cada requisição.
export function rastrearRequisicoes(req: Request, res: Response, next: NextFunction) {
  const id = randomUUID()
  emitir({
    tipo: 'inicio',
    id,
    pai: req.get('x-request-id'),
    faixa: 'api',
    rotulo: `${req.method} ${req.originalUrl.replace(/^\/api/, '')}`,
    em: Date.now(),
    requisicao: { cabecalhos: textos(req.headers), corpo: req.body && JSON.stringify(req.body) },
  })

  // Guarda o corpo da resposta para o inspetor (res.json também passa pelo res.send).
  let corpo: string | undefined
  const enviarOriginal = res.send.bind(res)
  res.send = (dados) => {
    if (typeof dados === 'string') corpo = dados.slice(0, 2000)
    return enviarOriginal(dados)
  }

  res.on('close', () => {
    const resultado = !res.writableFinished ? 'cancelada' : res.statusCode >= 400 ? 'erro' : 'ok'
    emitir({
      tipo: 'fim',
      id,
      resultado,
      detalhe: String(res.statusCode),
      em: Date.now(),
      resposta: { status: res.statusCode, cabecalhos: textos(res.getHeaders()), corpo },
    })
  })

  requisicaoAtual.run(id, next)
}

// Cabeçalhos como texto simples (alguns vêm como número ou lista).
function textos(cabecalhos: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(cabecalhos).map(([nome, valor]) => [nome, String(valor)]))
}
