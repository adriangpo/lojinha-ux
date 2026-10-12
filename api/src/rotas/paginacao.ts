import { Router } from 'express'
import { sql } from '../banco'

type Publicacao = { id: number; texto: string }

const POR_PAGINA = 10

export const rotasDePaginacao = Router()

// GET /api/feed/offset?pagina=2 — "pula os 10 primeiros e me dá os próximos 10".
// Se alguém publicar no meio do caminho, tudo anda uma posição e um item aparece repetido.
rotasDePaginacao.get('/feed/offset', async (req, res) => {
  const pagina = Number(req.query.pagina ?? 1)

  const itens = await sql<Publicacao>('SELECT id, texto FROM publicacoes ORDER BY id DESC LIMIT $1 OFFSET $2', [
    POR_PAGINA,
    (pagina - 1) * POR_PAGINA,
  ])
  const [{ total }] = await sql<{ total: number }>('SELECT count(*)::int AS total FROM publicacoes')

  res.json({ itens, totalDePaginas: Math.ceil(total / POR_PAGINA) })
})

// GET /api/feed/cursor?depoisDe=91 — "me dá os 10 que vêm depois do item 91".
// O cursor aponta para um item, não para uma posição: publicações novas não mudam nada.
rotasDePaginacao.get('/feed/cursor', async (req, res) => {
  const depoisDe = req.query.depoisDe ? Number(req.query.depoisDe) : null

  const itens = await sql<Publicacao>(
    `SELECT id, texto FROM publicacoes
     WHERE ($1::int IS NULL OR id < $1)
     ORDER BY id DESC
     LIMIT $2`,
    [depoisDe, POR_PAGINA],
  )

  // Página incompleta: acabou. Senão, o próximo cursor é o último item desta página.
  const proximoCursor = itens.length === POR_PAGINA ? itens[itens.length - 1].id : null
  res.json({ itens, proximoCursor })
})

// POST /api/feed — simula outra pessoa publicando enquanto o usuário rola.
rotasDePaginacao.post('/feed', async (_req, res) => {
  const [publicacao] = await sql<Publicacao>(
    "INSERT INTO publicacoes (texto) VALUES ('Publicação nova') RETURNING id, texto",
  )
  res.status(201).json(publicacao)
})
