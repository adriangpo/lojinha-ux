import { Router } from 'express'
import { sql } from '../banco'

type Vendedor = { id: number; nome: string; cidade: string }
type Comentario = { id: number; autor: string; texto: string; nota: number }
type Produto = { id: number; nome: string; categoria: string; precoCentavos: number }

export const rotasDeNMais1 = Router()

// ── Versão ruim: um endpoint por recurso. A tela precisa juntar as peças. ──

// GET /api/produtos/7
rotasDeNMais1.get('/produtos/:id', async (req, res) => {
  const [produto] = await sql<Produto & { vendedorId: number }>(
    `SELECT id, nome, categoria, preco_centavos AS "precoCentavos", vendedor_id AS "vendedorId"
     FROM produtos WHERE id = $1`,
    [req.params.id],
  )
  res.json(produto)
})

// GET /api/vendedores/2
rotasDeNMais1.get('/vendedores/:id', async (req, res) => {
  const [vendedor] = await sql<Vendedor>('SELECT id, nome, cidade FROM vendedores WHERE id = $1', [req.params.id])
  res.json(vendedor)
})

// GET /api/produtos/7/comentarios - devolve só os ids: o detalhe de cada um é outro endpoint.
rotasDeNMais1.get('/produtos/:id/comentarios', async (req, res) => {
  const linhas = await sql<{ id: number }>('SELECT id FROM comentarios WHERE produto_id = $1 ORDER BY id', [
    req.params.id,
  ])
  res.json(linhas.map((linha) => linha.id))
})

// GET /api/comentarios/31
rotasDeNMais1.get('/comentarios/:id', async (req, res) => {
  const [comentario] = await sql<Comentario>('SELECT id, autor, texto, nota FROM comentarios WHERE id = $1', [
    req.params.id,
  ])
  res.json(comentario)
})

// ── Versão boa: um endpoint que entrega o que a tela precisa. ──

// GET /api/telas/produto/7
rotasDeNMais1.get('/telas/produto/:id', async (req, res) => {
  // Uma consulta com JOIN traz o produto e o vendedor juntos.
  const [produto] = await sql<Produto & { vendedor: Vendedor }>(
    `SELECT p.id, p.nome, p.categoria, p.preco_centavos AS "precoCentavos",
            json_build_object('id', v.id, 'nome', v.nome, 'cidade', v.cidade) AS vendedor
     FROM produtos p
     JOIN vendedores v ON v.id = p.vendedor_id
     WHERE p.id = $1`,
    [req.params.id],
  )

  // Outra consulta traz todos os comentários de uma vez.
  const comentarios = await sql<Comentario>(
    'SELECT id, autor, texto, nota FROM comentarios WHERE produto_id = $1 ORDER BY id',
    [req.params.id],
  )

  res.json({ ...produto, comentarios })
})
