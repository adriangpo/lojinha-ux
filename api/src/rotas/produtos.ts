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

// GET /api/busca-lenta?busca=te — só para o tema Race conditions.
// Busca curta casa com mais produtos e demora mais: "f" leva ~2,1s, "fone" ~0,6s.
// Quem digita rápido recebe as respostas na ordem inversa, todas as vezes.
// Sem busca (a lista inicial), responde na hora.
rotasDeProdutos.get('/busca-lenta', async (req, res) => {
  const busca = typeof req.query.busca === 'string' ? req.query.busca : ''

  if (busca) await esperar(Math.max(300, 2600 - busca.length * 500))
  res.json(await buscar(busca, null))
})
