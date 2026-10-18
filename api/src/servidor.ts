import express, { type NextFunction, type Request, type Response } from 'express'
import { prepararFotos } from './armazenamento'
import { rotasDeControle, simularMundoReal } from './controle'
import { rastrearRequisicoes, transmitirEventos } from './monitor'
import { rotasDeCacheHttp } from './rotas/cache-http'
import { rotasDeCarrinho } from './rotas/carrinho'
import { rotasDeCupons } from './rotas/cupons'
import { rotasDeFavoritos } from './rotas/favoritos'
import { rotasDeImagens } from './rotas/imagens'
import { rotasDeNMais1 } from './rotas/n-mais-1'
import { rotasDeNovosProdutos } from './rotas/novos-produtos'
import { rotasDePaginacao } from './rotas/paginacao'
import { rotasDePedidos } from './rotas/pedidos'
import { rotasDeProdutos } from './rotas/produtos'
import { rotasDeSessao } from './rotas/sessao'
import { rotasDeSignedUrl } from './rotas/signed-url'
import { rotasDeUploads, transmitirProgresso } from './rotas/uploads'

const app = express()
app.use(express.json())

// Desligado no geral: com ETag, respostas repetidas voltam como 304 e confundem as demos.
// O tema de Caching faz o ETag na mão, numa rota só (rotas/cache-http.ts).
app.set('etag', false)

// Rotas do monitor e do painel: ficam fora da latência simulada e do rastreamento.
app.get('/api/monitor/eventos', transmitirEventos)
app.use('/api/controle', rotasDeControle)

// SSE do upload: aparece no monitor, mas fica fora da latência e da taxa de erro (a conexão fica aberta).
app.get('/api/uploads/:id/eventos', rastrearRequisicoes, transmitirProgresso)

// Rotas da lojinha.
app.use('/api', rastrearRequisicoes, simularMundoReal)
app.use('/api', rotasDeProdutos)
app.use('/api', rotasDeImagens)
app.use('/api', rotasDeCacheHttp)
app.use('/api', rotasDeNMais1)
app.use('/api', rotasDePaginacao)
app.use('/api', rotasDeSignedUrl)
app.use('/api', rotasDePedidos)
app.use('/api', rotasDeCupons)
app.use('/api', rotasDeSessao)
app.use('/api', rotasDeUploads)
app.use('/api', rotasDeNovosProdutos)
app.use('/api', rotasDeFavoritos)
app.use('/api', rotasDeCarrinho)

app.use((erro: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(erro)
  res.status(500).json({ erro: 'Erro interno' })
})

app.listen(3333, () => console.log('API rodando em http://localhost:3333'))

// Sem o MinIO só o tema de signed URL deixa de funcionar; o resto da API segue normal.
prepararFotos().catch(() => console.warn('MinIO fora do ar: rode `npm run banco`'))
