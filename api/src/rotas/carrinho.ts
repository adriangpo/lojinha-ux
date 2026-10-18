import { Router } from 'express'
import { sql } from '../banco'

export const rotasDeCarrinho = Router()

// POST /api/carrinho  { produtoId }  → { itens: 3 }: quantos itens o carrinho tem agora.
rotasDeCarrinho.post('/carrinho', async (req, res) => {
  await sql('INSERT INTO carrinho (produto_id) VALUES ($1)', [Number(req.body.produtoId)])
  const [{ itens }] = await sql<{ itens: number }>('SELECT count(*)::int AS itens FROM carrinho')
  res.status(201).json({ itens })
})
