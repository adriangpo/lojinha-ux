import { Highlight, themes } from 'prism-react-renderer'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Trecho } from '../monitor/useEventos'

// O painel de baixo da aba Rede: cabeçalhos, corpo enviado e corpo recebido de uma linha.

const FONTE = "system-ui, -apple-system, 'Segoe UI', sans-serif"
const MONO = 'Menlo, Consolas, monospace'
const BORDA = '#e0e0e2'

type Aba = 'cabecalhos' | 'requisicao' | 'resposta'

export function bytesFormatados(bytes?: number) {
  if (bytes === undefined) return '-'
  if (bytes === 0) return 'cache'
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} kB`
}

export function DetalhesDaRede({ trecho, fechar }: { trecho: Trecho; fechar: () => void }) {
  // Conexão SSE abre direto nas mensagens: é o que se quer ver chegando.
  const [aba, setAba] = useState<Aba>(trecho.mensagens ? 'resposta' : 'cabecalhos')
  const { requisicao, resposta } = trecho
  // No banco, o que "vai" é o SQL e não há corpo de resposta, só a contagem de linhas.
  const banco = trecho.faixa === 'banco'
  const abas: { nome: Aba; titulo: string }[] = [
    { nome: 'cabecalhos', titulo: banco ? 'Geral' : 'Cabeçalhos' },
    { nome: 'requisicao', titulo: banco ? 'SQL' : 'Requisição' },
    ...(banco ? [] : [{ nome: 'resposta' as Aba, titulo: 'Resposta' }]),
  ]

  return (
    <div
      style={{
        height: '50%',
        display: 'flex',
        flexDirection: 'column',
        borderTop: `1px solid ${BORDA}`,
        fontFamily: FONTE,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#f9f9fb',
          borderBottom: `1px solid ${BORDA}`,
        }}
      >
        {abas.map(({ nome, titulo }) => (
          <button
            key={nome}
            onClick={() => setAba(nome)}
            style={{
              border: 'none',
              background: 'transparent',
              padding: '6px 10px',
              fontSize: 12,
              fontFamily: FONTE,
              color: aba === nome ? '#0061e0' : '#15141a',
              borderBottom: aba === nome ? '2px solid #0061e0' : '2px solid transparent',
            }}
          >
            {titulo}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button
          onClick={fechar}
          aria-label="Fechar detalhes"
          style={{
            border: 'none',
            background: 'transparent',
            padding: '0 10px',
            fontSize: 14,
            color: '#5b5b66',
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          fontSize: 11,
        }}
      >
        {aba === 'cabecalhos' && (
          <>
            <Secao titulo="Geral">
              <Par nome="Requisição" valor={trecho.rotulo} />
              {trecho.detalhe && <Par nome={banco ? 'Resultado' : 'Status'} valor={trecho.detalhe} />}
              {resposta?.origem && <Par nome="Origem" valor={resposta.origem} />}
              {resposta?.bytes !== undefined && <Par nome="Transferido" valor={bytesFormatados(resposta.bytes)} />}
              {trecho.fim !== undefined && <Par nome="Tempo" valor={`${Math.round(trecho.fim - trecho.inicio)} ms`} />}
            </Secao>
            {resposta?.cabecalhos && <Secao titulo="Cabeçalhos da resposta" valores={resposta.cabecalhos} />}
            {requisicao?.cabecalhos && <Secao titulo="Cabeçalhos da requisição" valores={requisicao.cabecalhos} />}
          </>
        )}
        {aba === 'requisicao' && <Corpo texto={requisicao?.corpo} linguagem={banco ? 'sql' : 'json'} />}
        {aba === 'resposta' &&
          (trecho.mensagens ? <Mensagens mensagens={trecho.mensagens} /> : <Corpo texto={resposta?.corpo} linguagem="json" />)}
      </div>
    </div>
  )
}

// Um bloco com título que abre e fecha, como no Firefox; com `valores`, lista os cabeçalhos.
function Secao({ titulo, valores, children }: { titulo: string; valores?: Record<string, string>; children?: ReactNode }) {
  const [aberta, setAberta] = useState(true)
  const quantos = valores ? Object.keys(valores).length : undefined
  return (
    <section>
      <div
        onClick={() => setAberta(!aberta)}
        style={{
          padding: '4px 10px',
          background: '#f9f9fb',
          borderBottom: `1px solid ${BORDA}`,
          fontWeight: 600,
          color: '#15141a',
          userSelect: 'none',
        }}
      >
        <span style={{ display: 'inline-block', width: 12, color: '#5b5b66' }}>{aberta ? '▾' : '▸'}</span>
        {titulo}
        {quantos !== undefined && <span style={{ color: '#8f8f9d', fontWeight: 400 }}> ({quantos})</span>}
      </div>
      {aberta && (
        <div style={{ padding: '4px 0' }}>
          {children}
          {valores && Object.entries(valores).map(([nome, valor]) => <Par key={nome} nome={nome} valor={valor} mono />)}
        </div>
      )}
    </section>
  )
}

function Par({ nome, valor, mono }: { nome: string; valor: string; mono?: boolean }) {
  const fonte: CSSProperties = { fontFamily: mono ? MONO : FONTE }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(90px, 35%) 1fr',
        gap: 10,
        padding: '2px 10px',
        lineHeight: '17px',
      }}
    >
      <span style={{ ...fonte, color: '#5b5b66', wordBreak: 'break-all' }}>{nome}</span>
      <span style={{ ...fonte, color: '#15141a', wordBreak: 'break-all' }}>{valor}</span>
    </div>
  )
}

// SSE: a resposta nunca termina, então o Firefox lista as mensagens conforme chegam, uma por linha.
function Mensagens({ mensagens }: { mensagens: { em: number; dados: string }[] }) {
  const lista = useRef<HTMLDivElement>(null)

  // Acompanha a última mensagem, como o DevTools faz (rolando só o painel; scrollIntoView rolaria a página junto).
  useEffect(() => {
    const painel = lista.current?.parentElement
    if (painel) painel.scrollTop = painel.scrollHeight
  }, [mensagens.length])

  const celula: CSSProperties = { padding: '2px 10px', borderBottom: `1px solid ${BORDA}`, lineHeight: '17px' }
  return (
    <div ref={lista} style={{ fontFamily: MONO }}>
      <div style={{ ...celula, display: 'grid', gridTemplateColumns: '1fr 96px', background: '#f9f9fb', fontFamily: FONTE, fontWeight: 600 }}>
        <span>Dados</span>
        <span>Hora</span>
      </div>
      {mensagens.length === 0 && <div style={{ ...celula, color: '#8f8f9d', fontFamily: FONTE }}>Conectado. Esperando a primeira mensagem…</div>}
      {mensagens.map((mensagem, indice) => (
        <div key={indice} style={{ ...celula, display: 'grid', gridTemplateColumns: '1fr 96px', gap: 8 }}>
          <span style={{ wordBreak: 'break-all', color: '#15141a' }}>{mensagem.dados}</span>
          <span style={{ color: '#5b5b66' }}>{hora(mensagem.em)}</span>
        </div>
      ))}
    </div>
  )
}

function hora(em: number) {
  const data = new Date(em)
  return data.toLocaleTimeString('pt-BR', { hour12: false }) + '.' + String(data.getMilliseconds()).padStart(3, '0')
}

// JSON formatado e colorido, como a aba Resposta do Firefox. O que não é JSON aparece como veio.
function Corpo({ texto, linguagem }: { texto?: string; linguagem: 'json' | 'sql' }) {
  if (!texto) return <div style={{ padding: '8px 10px', color: '#8f8f9d' }}>Sem corpo.</div>

  let codigo = texto
  if (linguagem === 'json') {
    try {
      codigo = JSON.stringify(JSON.parse(texto), null, 2)
    } catch {
      // não é JSON: mostra como veio
    }
  }

  return (
    <Highlight theme={themes.github} code={codigo} language={linguagem}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre
          style={{
            ...style,
            background: 'white',
            margin: 0,
            padding: '6px 0',
            fontFamily: MONO,
            fontSize: 11,
            lineHeight: '16px',
          }}
        >
          {tokens.map((linha, indice) => (
            <div key={indice} {...getLineProps({ line: linha })} style={{ display: 'flex' }}>
              <span
                style={{
                  width: 32,
                  flexShrink: 0,
                  paddingRight: 8,
                  textAlign: 'right',
                  color: '#b1b1b3',
                  userSelect: 'none',
                }}
              >
                {indice + 1}
              </span>
              <span
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  paddingRight: 10,
                }}
              >
                {linha.map((token, i) => (
                  <span key={i} {...getTokenProps({ token })} />
                ))}
              </span>
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}
