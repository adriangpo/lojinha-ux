import { useEffect, useState } from 'react'
import { ouvirNavegador, type Detalhes, type Estilo, type EventoMonitor, type Faixa, type Resultado } from '../lib/monitor'

// Um trecho de trabalho: uma requisição, uma consulta ao banco, uma espera ou uma ação instantânea.
export type Trecho = {
  id: string
  pai?: string
  faixa: Faixa
  rotulo: string
  inicio: number
  fim?: number
  resultado?: Resultado
  detalhe?: string
  instantaneo: boolean
  estilo?: Estilo
  requisicao?: Detalhes
  resposta?: Detalhes
  // 0 a 1, quando quem fez a requisição sabe quanto já foi (upload).
  progresso?: number
  // Instantes em que chegou um aviso por esta conexão (SSE).
  tiques: number[]
  // Só nos avisos (mensagens empurradas pelo servidor): de onde veio.
  de?: Faixa
}

const LIMITE = 600

// Junta os eventos das duas fontes: navegador (BroadcastChannel) e API (SSE).
export function useEventos() {
  const [trechos, setTrechos] = useState<Trecho[]>([])

  useEffect(() => {
    const receber = (evento: EventoMonitor) => setTrechos((atuais) => aplicar(atuais, evento))

    const pararDeOuvirNavegador = ouvirNavegador(receber)
    const fonteDaApi = new EventSource('/api/monitor/eventos')
    fonteDaApi.onmessage = (mensagem) => receber(JSON.parse(mensagem.data))

    return () => {
      pararDeOuvirNavegador()
      fonteDaApi.close()
    }
  }, [])

  return { trechos, limpar: () => setTrechos([]) }
}

function aplicar(trechos: Trecho[], evento: EventoMonitor): Trecho[] {
  switch (evento.tipo) {
    case 'fim':
      return trechos.map((trecho) =>
        trecho.id !== evento.id
          ? trecho
          : {
              ...trecho,
              fim: evento.em,
              resultado: evento.resultado,
              detalhe: evento.detalhe,
              resposta: evento.resposta,
              // Respondido pelo cache do navegador: tracejado, como os outros caches.
              estilo: evento.resposta?.origem === 'cache' ? 'cache' : trecho.estilo,
            },
      )

    case 'progresso':
      return trechos.map((trecho) => (trecho.id === evento.id ? { ...trecho, progresso: evento.fracao } : trecho))

    case 'aviso': {
      const comTique = trechos.map((trecho) =>
        trecho.id === evento.trecho ? { ...trecho, tiques: [...trecho.tiques, evento.em] } : trecho,
      )
      const aviso: Trecho = {
        id: evento.id,
        faixa: evento.para,
        de: evento.de,
        rotulo: decodificar(evento.rotulo),
        inicio: evento.em,
        fim: evento.em,
        instantaneo: true,
        tiques: [],
      }
      return [...comTique.slice(-LIMITE), aviso]
    }

    case 'inicio':
    case 'marca': {
      const novo: Trecho = {
        id: evento.id,
        pai: evento.tipo === 'inicio' ? evento.pai : undefined,
        faixa: evento.faixa,
        rotulo: decodificar(evento.rotulo),
        inicio: evento.em,
        fim: evento.tipo === 'marca' ? evento.em : undefined,
        instantaneo: evento.tipo === 'marca',
        estilo: evento.estilo,
        requisicao: evento.tipo === 'inicio' ? evento.requisicao : undefined,
        tiques: [],
      }
      return [...trechos.slice(-LIMITE), novo]
    }
  }
}

// "/produtos?categoria=Eletr%C3%B4nicos" → "/produtos?categoria=Eletrônicos"
function decodificar(rotulo: string) {
  try {
    return decodeURIComponent(rotulo)
  } catch {
    return rotulo
  }
}
