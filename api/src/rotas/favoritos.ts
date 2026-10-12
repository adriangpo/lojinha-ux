import { Router } from 'express'
import { sql } from '../banco'

export const rotasDeFavoritos = Router()

// GET /api/favoritos → [3, 7]: os ids dos produtos favoritados.
rotasDeFavoritos.get('/favoritos', async (_req, res) => {
  const linhas = await sql<{ produto_id: number }>('SELECT produto_id FROM favoritos ORDER BY produto_id')
  res.json(linhas.map((linha) => linha.produto_id))
})

// PUT /api/favoritos/7 — favorita. Repetir não dá erro (ON CONFLICT DO NOTHING).
rotasDeFavoritos.put('/favoritos/:id', async (req, res) => {
  const produtoId = Number(req.params.id)
  await sql('INSERT INTO favoritos (produto_id) VALUES ($1) ON CONFLICT DO NOTHING', [produtoId])
  res.json({ produtoId, favorito: true })
})

// DELETE /api/favoritos/7 — desfavorita.
rotasDeFavoritos.delete('/favoritos/:id', async (req, res) => {
  const produtoId = Number(req.params.id)
  await sql('DELETE FROM favoritos WHERE produto_id = $1', [produtoId])
  res.json({ produtoId, favorito: false })
})
