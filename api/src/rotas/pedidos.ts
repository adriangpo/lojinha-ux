import { Router } from 'express'
import { setTimeout as esperar } from 'node:timers/promises'
import { sql } from '../banco'

type Pedido = {
  id: number
  produto: string
  chave: string | null
  criadoEm: string
}

export const rotasDePedidos = Router()

// GET /api/pedidos — a tabela que aparece embaixo do botão "Comprar".
rotasDePedidos.get('/pedidos', async (_req, res) => {
  const pedidos = await sql<Pedido>(
    `SELECT pedidos.id, produtos.nome AS produto, chave_de_idempotencia AS chave, criado_em AS "criadoEm"
     FROM pedidos JOIN produtos ON produtos.id = pedidos.produto_id
     ORDER BY pedidos.id DESC`,
  )
  res.json(pedidos)
})

// DELETE /api/pedidos — zera a tabela entre uma versão e outra da demo.
rotasDePedidos.delete('/pedidos', async (_req, res) => {
  await sql('DELETE FROM pedidos')
  res.json({ ok: true })
})

// POST /api/pedidos  { produtoId }  (cabeçalho opcional: Idempotency-Key)
rotasDePedidos.post('/pedidos', async (req, res) => {
  const produtoId = Number(req.body.produtoId)
  const chave = req.get('Idempotency-Key')

  // Simula o pagamento: 1 segundo sem resposta é o que faz o usuário clicar de novo.
  await esperar(1000)

  // Sem chave: cada request vira um pedido novo, mesmo que seja o mesmo clique repetido.
  if (!chave) {
    const [pedido] = await sql<{ id: number }>('INSERT INTO pedidos (produto_id) VALUES ($1) RETURNING id', [produtoId])
    res.status(201).json(pedido)
    return
  }

  // Com chave: se ela já foi usada, o banco não insere (UNIQUE) e a gente devolve o pedido que já existe.
  const [novo] = await sql<{ id: number }>(
    `INSERT INTO pedidos (produto_id, chave_de_idempotencia) VALUES ($1, $2)
     ON CONFLICT (chave_de_idempotencia) DO NOTHING
     RETURNING id`,
    [produtoId, chave],
  )
  if (novo) {
    res.status(201).json(novo)
    return
  }

  const [existente] = await sql<{ id: number }>('SELECT id FROM pedidos WHERE chave_de_idempotencia = $1', [chave])
  // Avisa que é uma repetição: mesma resposta, nenhum pedido novo.
  res.set('Idempotent-Replayed', 'true')
  res.json(existente)
})
