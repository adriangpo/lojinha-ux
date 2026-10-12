import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Router } from 'express'
import { assinador, BUCKET } from '../armazenamento'
import { sql } from '../banco'

type Produto = { id: number; nome: string; precoCentavos: number }

const UMA_HORA = 60 * 60 * 1000

async function produtosDaVitrine() {
  return sql<Produto>(
    `SELECT id, nome, preco_centavos AS "precoCentavos" FROM produtos ORDER BY id LIMIT 12`,
  )
}

export const rotasDeSignedUrl = Router()

// GET /api/vitrine/url-nova — assina cada foto na hora do pedido.
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

// GET /api/vitrine/url-reaproveitada — assina como se fosse o começo da hora.
// Durante a mesma hora a URL é idêntica, então o navegador usa a foto que já tem no cache.
rotasDeSignedUrl.get('/vitrine/url-reaproveitada', async (_req, res) => {
  const produtos = await produtosDaVitrine()
  const comecoDaHora = new Date(Math.floor(Date.now() / UMA_HORA) * UMA_HORA)

  const vitrine = await Promise.all(
    produtos.map(async (produto) => ({
      ...produto,
      foto: await getSignedUrl(assinador, new GetObjectCommand({ Bucket: BUCKET, Key: `${produto.id}.jpg` }), {
        signingDate: comecoDaHora,
        // Vale 2 horas a partir do começo da hora: sempre sobra pelo menos 1 hora,
        // que é o tempo que a foto fica no cache (max-age=3600). O cache nunca dura mais que a URL.
        expiresIn: 2 * 60 * 60,
      }),
    })),
  )

  res.json(vitrine)
})
