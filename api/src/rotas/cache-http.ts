import { createHash } from 'node:crypto'
import { Router } from 'express'
import { sql } from '../banco'

type Produto = {
  id: number
  nome: string
  categoria: string
  precoCentavos: number
}

export const rotasDeCacheHttp = Router()

// GET /api/produtos-com-cache?categoria=Livros
// Mesma consulta de /produtos, mas a resposta diz ao navegador como guardá-la.
rotasDeCacheHttp.get('/produtos-com-cache', async (req, res) => {
  const categoria = typeof req.query.categoria === 'string' ? req.query.categoria : null

  const produtos = await sql<Produto>(
    `SELECT id, nome, categoria, preco_centavos AS "precoCentavos"
     FROM produtos
     WHERE ($1::text IS NULL OR categoria = $1)
     ORDER BY nome
     LIMIT 20`,
    [categoria],
  )
  const corpo = JSON.stringify(produtos)

  // 1. Por 10 segundos o navegador usa a cópia dele, sem nem perguntar à API.
  res.set('Cache-Control', 'max-age=10')

  // 2. Depois disso ele pergunta "mudou?" mandando a ETag que guardou (If-None-Match).
  //    Se não mudou, a resposta é 304: sem corpo, só "pode usar o que você tem".
  res.set('ETag', `"${createHash('sha1').update(corpo).digest('hex')}"`)
  if (req.fresh) {
    res.status(304).end()
    return
  }

  res.type('json').send(corpo)
})
