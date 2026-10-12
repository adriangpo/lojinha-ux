import type { ComponentType } from 'react'
import { BuscaComDebounce } from './temas/debounce/BuscaComDebounce'
import { BuscaSemDebounce } from './temas/debounce/BuscaSemDebounce'
import { BuscaComCancelamento } from './temas/race-condition/BuscaComCancelamento'
import { BuscaSemCancelamento } from './temas/race-condition/BuscaSemCancelamento'
import { CacheHttp } from './temas/cache/CacheHttp'
import { CacheNaMao } from './temas/cache/CacheNaMao'
import { ComTanstackQuery } from './temas/cache/ComTanstackQuery'
import { SemCache } from './temas/cache/SemCache'
import { UrlNovaACadaVez } from './temas/signed-url/UrlNovaACadaVez'
import { UrlReaproveitada } from './temas/signed-url/UrlReaproveitada'
import { SoQuandoAparece } from './temas/lazy-loading/SoQuandoAparece'
import { TudoDeUmaVez } from './temas/lazy-loading/TudoDeUmaVez'
import { InfinitoComCursor } from './temas/paginacao/InfinitoComCursor'
import { InfinitoComOffset } from './temas/paginacao/InfinitoComOffset'
import { PaginasNumeradas } from './temas/paginacao/PaginasNumeradas'
import { UmEndpoint } from './temas/n-mais-1/UmEndpoint'
import { VariasRequisicoes } from './temas/n-mais-1/VariasRequisicoes'
import { CadastroComValidacao } from './temas/formularios/CadastroComValidacao'
import { CadastroSoNoServidor } from './temas/formularios/CadastroSoNoServidor'
import { ErroGenerico } from './temas/erros-uteis/ErroGenerico'
import { ErroPorCampo } from './temas/erros-uteis/ErroPorCampo'
import { FiltrosNaUrl } from './temas/url-como-estado/FiltrosNaUrl'
import { FiltrosNoEstado } from './temas/url-como-estado/FiltrosNoEstado'
import { ListaComEstados } from './temas/estados-da-tela/ListaComEstados'
import { ListaSemEstados } from './temas/estados-da-tela/ListaSemEstados'
import { ListaComSkeleton } from './temas/skeleton/ListaComSkeleton'
import { ListaComSpinner } from './temas/skeleton/ListaComSpinner'
import { ImagemComEspacoReservado } from './temas/layout-shift/ImagemComEspacoReservado'
import { ImagemSemTamanho } from './temas/layout-shift/ImagemSemTamanho'
import { ScrollComThrottle } from './temas/debounce/ScrollComThrottle'
import { FavoritarEsperando } from './temas/optimistic-ui/FavoritarEsperando'
import { FavoritarNaHora } from './temas/optimistic-ui/FavoritarNaHora'
import { ComPolling } from './temas/upload/ComPolling'
import { ComSse } from './temas/upload/ComSse'
import { SemProgresso } from './temas/upload/SemProgresso'
import { BotaoTravado } from './temas/clique-duplo/BotaoTravado'
import { ComChaveDeIdempotencia } from './temas/clique-duplo/ComChaveDeIdempotencia'
import { SemProtecao } from './temas/clique-duplo/SemProtecao'
import { ComBackoff } from './temas/retry/ComBackoff'
import { RetrySemParar } from './temas/retry/RetrySemParar'
import { SemRetry } from './temas/retry/SemRetry'
import { ComRetryAfter } from './temas/rate-limiting/ComRetryAfter'
import { LimiteSemExplicacao } from './temas/rate-limiting/LimiteSemExplicacao'
import { SemLimite } from './temas/rate-limiting/SemLimite'
import { ComModalDeLogin } from './temas/sessao-expirada/ComModalDeLogin'
import { PerdeOFormulario } from './temas/sessao-expirada/PerdeOFormulario'

export type Etiqueta = 'Frontend' | 'API' | 'Frontend + API'

export type Tema = {
  slug: string
  titulo: string
  etiqueta: Etiqueta
  bloco: string
  versoes: { nome: string; componente: ComponentType }[]
}

const ANTES = '1. Antes do clique'
const ESPERA = '2. Durante a espera'
const ERRO = '3. Quando dá errado'
const RAPIDEZ = '4. Rapidez de verdade'

// Na ordem da apresentação: antes do clique, durante a espera, quando dá errado, rapidez.
export const TEMAS: Tema[] = [
  {
    slug: 'formularios',
    titulo: 'Formulários e validação',
    etiqueta: 'Frontend',
    bloco: ANTES,
    versoes: [
      { nome: 'Só no servidor', componente: CadastroSoNoServidor },
      { nome: 'Validação no front', componente: CadastroComValidacao },
    ],
  },
  {
    slug: 'erros-uteis',
    titulo: 'Erros úteis',
    etiqueta: 'API',
    bloco: ANTES,
    versoes: [
      { nome: 'Erro genérico', componente: ErroGenerico },
      { nome: '422 com erro por campo', componente: ErroPorCampo },
    ],
  },
  {
    slug: 'url-como-estado',
    titulo: 'URL como estado',
    etiqueta: 'Frontend',
    bloco: ANTES,
    versoes: [
      { nome: 'Filtros no useState', componente: FiltrosNoEstado },
      { nome: 'Filtros na URL', componente: FiltrosNaUrl },
    ],
  },

  {
    slug: 'estados-da-tela',
    titulo: 'Estados da tela',
    etiqueta: 'Frontend',
    bloco: ESPERA,
    versoes: [
      { nome: 'Tela branca', componente: ListaSemEstados },
      { nome: 'Quatro estados', componente: ListaComEstados },
    ],
  },
  {
    slug: 'skeleton',
    titulo: 'Skeleton Loading',
    etiqueta: 'Frontend',
    bloco: ESPERA,
    versoes: [
      { nome: 'Spinner', componente: ListaComSpinner },
      { nome: 'Skeleton', componente: ListaComSkeleton },
    ],
  },
  {
    slug: 'layout-shift',
    titulo: 'Layout shift',
    etiqueta: 'Frontend',
    bloco: ESPERA,
    versoes: [
      { nome: 'Imagem sem tamanho', componente: ImagemSemTamanho },
      { nome: 'Espaço reservado', componente: ImagemComEspacoReservado },
    ],
  },
  {
    slug: 'debounce',
    titulo: 'Debounce e Throttle',
    etiqueta: 'Frontend',
    bloco: ESPERA,
    versoes: [
      { nome: 'Sem debounce', componente: BuscaSemDebounce },
      { nome: 'Com debounce', componente: BuscaComDebounce },
      { nome: 'Throttle no scroll', componente: ScrollComThrottle },
    ],
  },
  {
    slug: 'race-condition',
    titulo: 'Race conditions e AbortController',
    etiqueta: 'Frontend',
    bloco: ESPERA,
    versoes: [
      { nome: 'Sem cancelamento', componente: BuscaSemCancelamento },
      { nome: 'Com AbortController', componente: BuscaComCancelamento },
    ],
  },
  {
    slug: 'optimistic-ui',
    titulo: 'Optimistic UI',
    etiqueta: 'Frontend + API',
    bloco: ESPERA,
    versoes: [
      { nome: 'Espera a API', componente: FavoritarEsperando },
      { nome: 'Muda na hora', componente: FavoritarNaHora },
    ],
  },
  {
    slug: 'upload',
    titulo: 'Upload com progresso e tempo real',
    etiqueta: 'Frontend + API',
    bloco: ESPERA,
    versoes: [
      { nome: 'Sem progresso', componente: SemProgresso },
      { nome: 'Polling', componente: ComPolling },
      { nome: 'SSE', componente: ComSse },
    ],
  },

  {
    slug: 'clique-duplo',
    titulo: 'Clique duplo e idempotência',
    etiqueta: 'Frontend + API',
    bloco: ERRO,
    versoes: [
      { nome: 'Sem proteção', componente: SemProtecao },
      { nome: 'Botão travado', componente: BotaoTravado },
      { nome: 'Chave de idempotência', componente: ComChaveDeIdempotencia },
    ],
  },
  {
    slug: 'retry',
    titulo: 'Retries e exponential backoff',
    etiqueta: 'Frontend + API',
    bloco: ERRO,
    versoes: [
      { nome: 'Sem retry', componente: SemRetry },
      { nome: 'Retry sem parar', componente: RetrySemParar },
      { nome: 'Exponential backoff', componente: ComBackoff },
    ],
  },
  {
    slug: 'rate-limiting',
    titulo: 'Rate Limiting',
    etiqueta: 'API',
    bloco: ERRO,
    versoes: [
      { nome: 'Sem limite', componente: SemLimite },
      { nome: '429 sem explicação', componente: LimiteSemExplicacao },
      { nome: 'Com Retry-After', componente: ComRetryAfter },
    ],
  },
  {
    slug: 'sessao-expirada',
    titulo: 'Sessão expirada',
    etiqueta: 'Frontend + API',
    bloco: ERRO,
    versoes: [
      { nome: 'Perde o formulário', componente: PerdeOFormulario },
      { nome: 'Modal de login', componente: ComModalDeLogin },
    ],
  },

  {
    slug: 'cache',
    titulo: 'Caching',
    etiqueta: 'Frontend + API',
    bloco: RAPIDEZ,
    versoes: [
      { nome: 'Sem cache', componente: SemCache },
      { nome: 'Cache na mão', componente: CacheNaMao },
      { nome: 'TanStack Query', componente: ComTanstackQuery },
      { nome: 'Cache HTTP', componente: CacheHttp },
    ],
  },
  {
    slug: 'signed-url',
    titulo: 'Imagens com signed URL',
    etiqueta: 'Frontend + API',
    bloco: RAPIDEZ,
    versoes: [
      { nome: 'URL nova a cada vez', componente: UrlNovaACadaVez },
      { nome: 'URL reaproveitada', componente: UrlReaproveitada },
    ],
  },
  {
    slug: 'lazy-loading',
    titulo: 'Lazy Loading',
    etiqueta: 'Frontend',
    bloco: RAPIDEZ,
    versoes: [
      { nome: 'Tudo de uma vez', componente: TudoDeUmaVez },
      { nome: 'loading="lazy"', componente: SoQuandoAparece },
    ],
  },
  {
    slug: 'n-mais-1',
    titulo: 'N+1 requests',
    etiqueta: 'API',
    bloco: RAPIDEZ,
    versoes: [
      { nome: 'Um endpoint por recurso', componente: VariasRequisicoes },
      { nome: 'Um endpoint por tela', componente: UmEndpoint },
    ],
  },
  {
    slug: 'paginacao',
    titulo: 'Pagination vs Infinite Scroll',
    etiqueta: 'Frontend + API',
    bloco: RAPIDEZ,
    versoes: [
      { nome: 'Páginas numeradas', componente: PaginasNumeradas },
      { nome: 'Infinito com offset', componente: InfinitoComOffset },
      { nome: 'Infinito com cursor', componente: InfinitoComCursor },
    ],
  },
]

export const BLOCOS = [ANTES, ESPERA, ERRO, RAPIDEZ]
