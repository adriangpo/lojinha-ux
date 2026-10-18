import { Router } from 'express'
import { imagemDoProduto } from '../imagens'

export const rotasDeImagens = Router()

// GET /api/imagens/7 - a foto do produto 7.
// `no-store`: nada vai para o cache HTTP, então o F5 baixa de novo e as demos de carregamento se repetem.
// Sem F5, quem cuida disso é o front, com o ?visita= (a memória de imagens da aba ignora o no-store).
rotasDeImagens.get('/imagens/:id', async (req, res) => {
  const imagem = await imagemDoProduto(Number(req.params.id))
  res.type('jpeg').set('Cache-Control', 'no-store').send(imagem)
})
