import { Router, type Request, type Response } from 'express'
import { randomUUID } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { setTimeout as esperar } from 'node:timers/promises'
import pg from 'pg'
import { sql, URL_DO_BANCO } from '../banco'
import { emitir } from '../monitor'

type Status = {
  id: number
  progresso: number
  etapa: string
}

// Em localhost o upload termina num piscar de olhos; lendo devagar, a barra da fase 1 aparece.
const BYTES_POR_SEGUNDO = 2_000_000

export const rotasDeUploads = Router()

// POST /api/uploads?nome=foto.jpg  (corpo: o arquivo, em bytes)
// Fase 1: recebe o arquivo. Quem mede o progresso desta fase é o navegador.
rotasDeUploads.post('/uploads', async (req, res) => {
  let tamanho = 0
  for await (const pedaco of req) {
    tamanho += pedaco.length
    await esperar((pedaco.length / BYTES_POR_SEGUNDO) * 1000)
  }
  // Para a demo, o arquivo é descartado: o que importa é o fluxo.

  const [upload] = await sql<{ id: number }>(
    'INSERT INTO uploads (nome_do_arquivo, tamanho_em_bytes) VALUES ($1, $2) RETURNING id',
    [String(req.query.nome ?? 'arquivo'), tamanho],
  )

  // Responde já e processa depois: o usuário não fica preso na request.
  processar(upload.id).catch(console.error)
  res.status(201).json(upload)
})

// Fase 2: o "worker". Só o servidor sabe em que ponto está, então ele grava no banco.
async function processar(id: number) {
  for (let progresso = 5; progresso <= 100; progresso += 5) {
    await esperar(400)
    await sql('UPDATE uploads SET progresso = $2, etapa = $3 WHERE id = $1', [id, progresso, etapaDe(progresso)])
  }
}

function etapaDe(progresso: number) {
  if (progresso < 35) return 'Verificando o arquivo'
  if (progresso < 70) return 'Gerando miniaturas'
  if (progresso < 100) return 'Otimizando a imagem'
  return 'Pronto'
}

// GET /api/uploads/:id - usado pelo polling: o front pergunta, a API responde o que tem agora.
rotasDeUploads.get('/uploads/:id', async (req, res) => {
  const [status] = await sql<Status>('SELECT id, progresso, etapa FROM uploads WHERE id = $1', [Number(req.params.id)])
  res.json(status)
})

// LISTEN precisa de uma conexão só dela: as do pool são emprestadas e devolvidas a cada consulta.
// Uma conexão para a API inteira; o EventEmitter distribui os avisos entre as conexões SSE.
const avisos = new EventEmitter()
avisos.setMaxListeners(0)

const ouvinte = new pg.Client({ connectionString: URL_DO_BANCO })
ouvinte.on('error', console.error)
ouvinte.on('notification', (aviso) => {
  const status: Status = JSON.parse(aviso.payload ?? '{}')
  emitir({ tipo: 'aviso', id: randomUUID(), de: 'banco', para: 'api', rotulo: `NOTIFY ${status.progresso}%`, em: Date.now() })
  avisos.emit('progresso', status)
})
await ouvinte.connect()
await ouvinte.query('LISTEN uploads')

// GET /api/uploads/:id/eventos - SSE: a API avisa o front a cada NOTIFY do Postgres.
// Registrada em servidor.ts fora da latência simulada: a conexão fica aberta o tempo todo.
export async function transmitirProgresso(req: Request, res: Response) {
  const id = Number(req.params.id)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const enviar = (status: Status) => {
    if (status.id !== id || res.writableEnded) return
    res.write(`data: ${JSON.stringify(status)}\n\n`)
    if (status.progresso === 100) res.end()
  }
  avisos.on('progresso', enviar)
  req.on('close', () => avisos.off('progresso', enviar))

  // Quem conecta no meio do processamento recebe primeiro o estado atual.
  const [atual] = await sql<Status>('SELECT id, progresso, etapa FROM uploads WHERE id = $1', [id])
  if (atual) enviar(atual)
}
