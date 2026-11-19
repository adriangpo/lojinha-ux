import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Router } from 'express'
import { assinador, BUCKET } from '../armazenamento'
import { sql } from '../banco'

type Produto = { id: number; nome: string; precoCentavos: number }

const UMA_HORA = 60 * 60 * 1000

// Começo do período em que a URL não muda. Na vida real seria o começo da hora; aqui o período
// começa quando a API sobe, e o monitor pode recomeçar ("Esquecer URLs assinadas"), para mostrar
// de novo o primeiro download sem limpar o cache do navegador.
let comecoDoPeriodo = Date.now()

export function recomecarPeriodo() {
  comecoDoPeriodo = Date.now()
}

function periodoAtual() {
  // Passou uma hora: começa o período seguinte, e a URL muda uma vez.
  while (Date.now() - comecoDoPeriodo >= UMA_HORA) comecoDoPeriodo += UMA_HORA
  return new Date(comecoDoPeriodo)
}

async function produtosDaVitrine() {
  return sql<Produto>(
    `SELECT id, nome, preco_centavos AS "precoCentavos" FROM produtos ORDER BY id LIMIT 12`,
  )
}

export const rotasDeSignedUrl = Router()

// GET /api/vitrine/url-nova - assina cada foto na hora do pedido.
// A data da assinatura vai na URL: a cada F5 a URL muda e, para o navegador, é outro arquivo.
rotasDeSignedUrl.get('/vitrine/url-nova', async (_req, res) => {
  const produtos = await produtosDaVitrine()

  const vitrine = await Promise.all(
    produtos.map(async (produto) => ({
      ...produto,
      foto: await getSignedUrl(assinador, new GetObjectCommand({ Bucket: BUCKET, Key: `${produto.id}.jpg` }), {
        expiresIn: 60 * 60,
      }),
    })),
  )

  res.json(vitrine)
})

// GET /api/vitrine/url-reaproveitada - assina como se fosse o começo do período.
// Durante o mesmo período a URL é idêntica, então o navegador usa a foto que já tem no cache.
rotasDeSignedUrl.get('/vitrine/url-reaproveitada', async (_req, res) => {
  const produtos = await produtosDaVitrine()
  const comecoDoPeriodo = periodoAtual()

  const vitrine = await Promise.all(
    produtos.map(async (produto) => ({
      ...produto,
      foto: await getSignedUrl(assinador, new GetObjectCommand({ Bucket: BUCKET, Key: `${produto.id}.jpg` }), {
        signingDate: comecoDoPeriodo,
        // Vale 2 horas a partir do começo do período: sempre sobra pelo menos 1 hora,
        // que é o tempo que a foto fica no cache (max-age=3600). O cache nunca dura mais que a URL.
        expiresIn: 2 * 60 * 60,
      }),
    })),
  )

  res.json(vitrine)
})
