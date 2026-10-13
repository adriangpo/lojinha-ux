// Acha o código de cada versão para o botão "Ver código": o arquivo do componente,
// os arquivos da mesma pasta que ele importa e as rotas da API que ele chama.

// Os textos dos arquivos, como string (?raw). Só para a apresentação: nada disso roda.
const FRONT = import.meta.glob<string>('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true })
const API = import.meta.glob<string>('../../../api/src/rotas/*.ts', { query: '?raw', import: 'default', eager: true })

export type Arquivo = {
  nome: string
  lado: 'Frontend' | 'API'
  codigo: string
  // Linhas (a partir de 1) que merecem destaque: na API, as rotas que esta tela chama.
  destaques: number[]
}

export function arquivosDaVersao(nomeDoComponente: string): Arquivo[] {
  const principal = Object.keys(FRONT).find((caminho) =>
    new RegExp(`export function ${nomeDoComponente}\\b`).test(FRONT[caminho]),
  )
  if (!principal) return []

  // Segue os imports relativos: os da pasta do tema e de hooks/ aparecem; os de lib/ só entram na busca de rotas.
  const pastaDoTema = principal.slice(0, principal.lastIndexOf('/'))
  const aparece = (caminho: string) => caminho.startsWith(pastaDoTema) || caminho.includes('/hooks/')
  const visitados = new Set<string>()
  const fila = [principal]
  while (fila.length > 0) {
    const atual = fila.shift()!
    if (visitados.has(atual) || !FRONT[atual]) continue
    visitados.add(atual)
    for (const [, relativo] of FRONT[atual].matchAll(/from '(\.[^']+)'/g)) {
      const resolvido = resolver(atual, relativo)
      if (resolvido && (aparece(resolvido) || resolvido.includes('/lib/')) && !resolvido.endsWith('/lib/monitor.ts')) {
        fila.push(resolvido)
      }
    }
  }

  const doFront = [...visitados]
    .filter(aparece)
    .map((caminho): Arquivo => ({ nome: caminho.split('/').at(-1)!, lado: 'Frontend', codigo: FRONT[caminho], destaques: [] }))

  // Caminhos que o front chama: api('/novos-produtos'), fetch(`/api/uploads/...`), <img src={`/api/imagens/...`}>.
  const chamados = [...visitados].flatMap((caminho) =>
    [...FRONT[caminho].matchAll(/(?:(?:api(?:<[^>]*>)?|fetch)\(\s*|src=\{?)['"`](\/[^'"`?$]*)/g)]
      .filter(([trecho, url]) => !trecho.startsWith('src') || url.startsWith('/api/'))
      .map(([, url]) => segmentos(url.replace(/^\/api/, ''))),
  ).filter((partes) => partes.length > 0)

  const daApi = Object.entries(API).flatMap(([caminho, codigo]): Arquivo[] => {
    const destaques = codigo.split('\n').flatMap((linha, indice) => {
      const rota = linha.match(/\.(?:get|post|put|patch|delete)\(\s*'([^']+)'/)?.[1]
      return rota && chamados.some((chamado) => combina(chamado, segmentos(rota))) ? [indice + 1] : []
    })
    return destaques.length > 0 ? [{ nome: `api/rotas/${caminho.split('/').at(-1)}`, lado: 'API', codigo, destaques }] : []
  })

  return [...doFront, ...daApi]
}

function resolver(de: string, relativo: string) {
  const partes = de.split('/').slice(0, -1)
  for (const parte of relativo.split('/')) {
    if (parte === '..') partes.pop()
    else if (parte !== '.') partes.push(parte)
  }
  const base = partes.join('/')
  return [`${base}.tsx`, `${base}.ts`].find((caminho) => caminho in FRONT)
}

const segmentos = (url: string) => url.split('/').filter(Boolean)

// "/produtos/7/comentarios" combina com "/produtos/:id/comentarios"; o front pode ter parado antes de um ${id}.
function combina(chamado: string[], rota: string[]) {
  if (chamado.length > rota.length) return false
  return chamado.every((parte, i) => rota[i].startsWith(':') || rota[i] === parte) && (chamado.length === rota.length || rota[chamado.length].startsWith(':'))
}
