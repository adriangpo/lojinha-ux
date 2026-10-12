import type { Trecho } from './useEventos'

// "GET /imagens/17" → "GET /imagens/:id": requisições iguais a menos do id.
const formaDoRotulo = (rotulo: string) => rotulo.replace(/\/\d+/g, '/:id')

// Esconde o que bate com o filtro (ex.: "imagens") e, se pedido, junta requisições iguais
// que aconteceram juntas numa barra só: "200× GET /imagens/:id".
export function organizar(trechos: Trecho[], { esconder, agrupar }: { esconder: string; agrupar: boolean }) {
  const filtro = esconder.trim().toLowerCase()
  const visiveis = filtro ? trechos.filter((trecho) => !trecho.rotulo.toLowerCase().includes(filtro)) : trechos
  if (!agrupar) return visiveis

  const grupos: Trecho[][] = []
  const grupoAberto = new Map<string, Trecho[]>()

  for (const trecho of [...visiveis].sort((a, b) => a.inicio - b.inicio)) {
    if (trecho.instantaneo) {
      grupos.push([trecho])
      continue
    }
    const chave = `${trecho.faixa} ${formaDoRotulo(trecho.rotulo)}`
    const grupo = grupoAberto.get(chave)
    const fimDoGrupo = grupo && Math.max(...grupo.map((membro) => membro.fim ?? Infinity))
    // Começou antes de o grupo terminar (ou logo depois): faz parte da mesma leva.
    if (grupo && fimDoGrupo !== undefined && trecho.inicio <= fimDoGrupo + 300) {
      grupo.push(trecho)
    } else {
      const novo = [trecho]
      grupos.push(novo)
      grupoAberto.set(chave, novo)
    }
  }

  return grupos.map((grupo) => (grupo.length < 3 ? grupo : [resumir(grupo)])).flat()
}

function resumir(grupo: Trecho[]): Trecho {
  const [primeiro] = grupo
  const terminou = grupo.every((membro) => membro.fim !== undefined)
  const falhas = grupo.filter((membro) => membro.resultado === 'erro').length
  const doCache = grupo.filter((membro) => membro.estilo === 'cache').length

  return {
    ...primeiro,
    id: `grupo-${primeiro.id}`,
    rotulo: `${grupo.length}× ${formaDoRotulo(primeiro.rotulo)}`,
    inicio: Math.min(...grupo.map((membro) => membro.inicio)),
    fim: terminou ? Math.max(...grupo.map((membro) => membro.fim!)) : undefined,
    resultado: falhas > 0 ? 'erro' : 'ok',
    detalhe: [falhas && `${falhas} com erro`, doCache && `${doCache} do cache`].filter(Boolean).join(', ') || undefined,
    estilo: doCache === grupo.length ? 'cache' : undefined,
    progresso: undefined,
    tiques: [],
    requisicao: undefined,
    resposta: undefined,
  }
}
