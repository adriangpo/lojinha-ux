import { Router } from 'express'
import { sql } from '../banco'

type Produto = {
  id: number
  nome: string
  categoria: string
  precoCentavos: number
}

export const rotasDeProdutos = Router()

// GET /api/produtos?busca=fone&categoria=Eletrônicos
rotasDeProdutos.get('/produtos', async (req, res) => {
  const busca = typeof req.query.busca === 'string' ? req.query.busca : ''
  const categoria = typeof req.query.categoria === 'string' ? req.query.categoria : null

  const produtos = await sql<Produto>(
    `SELECT id, nome, categoria, preco_centavos AS "precoCentavos"
     FROM produtos
     WHERE nome ILIKE '%' || $1 || '%'
       AND ($2::text IS NULL OR categoria = $2)
     ORDER BY nome
     LIMIT 20`,
    [busca, categoria],
  )

  res.json(produtos)
})
