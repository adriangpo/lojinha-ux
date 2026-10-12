import { Router } from 'express'
import { imagemDoProduto } from '../imagens'

export const rotasDeImagens = Router()

// GET /api/imagens/7 — a foto do produto 7.
// `no-store`: o navegador baixa de novo toda vez, para as demos de carregamento serem repetíveis.
rotasDeImagens.get('/imagens/:id', async (req, res) => {
  const imagem = await imagemDoProduto(Number(req.params.id))
  res.type('jpeg').set('Cache-Control', 'no-store').send(imagem)
})
