import { Router } from 'express'
import { sql } from '../banco'

type Produto = {
  id: number
  nome: string
  categoria: string
  precoCentavos: number
}

export const rotasDeProdutos = Router()

async function buscar(busca: string, categoria: string | null) {
  return sql<Produto>(
    `SELECT id, nome, categoria, preco_centavos AS "precoCentavos"
     FROM produtos
     WHERE nome ILIKE '%' || $1 || '%'
       AND ($2::text IS NULL OR categoria = $2)
     ORDER BY nome
     LIMIT 20`,
    [busca, categoria],
  )
}

// GET /api/produtos?busca=fone&categoria=Eletrônicos
rotasDeProdutos.get('/produtos', async (req, res) => {
  const busca = typeof req.query.busca === 'string' ? req.query.busca : ''
  const categoria = typeof req.query.categoria === 'string' ? req.query.categoria : null

  res.json(await buscar(busca, categoria))
})

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms))

// GET /api/categoria-lenta?categoria=Casa - só para o tema Race conditions.
// Eletrônicos sempre demora 2s; as outras categorias, 0,3s. Quem clica em Eletrônicos
// e logo depois em Casa recebe a resposta de Casa primeiro, todas as vezes.
rotasDeProdutos.get('/categoria-lenta', async (req, res) => {
  const categoria = typeof req.query.categoria === 'string' ? req.query.categoria : null

  await esperar(categoria === 'Eletrônicos' ? 2000 : 300)
  res.json(await buscar('', categoria))
})
