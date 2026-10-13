import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useEventos, type Trecho } from '../monitor/useEventos'
import { PainelDeRede } from './PainelDeRede'

// Versão compacta do monitor, ao lado da lojinha, imitando o console do Firefox:
// uma linha por evento, na ordem em que aconteceram.

const FONTE = "Menlo, Consolas, 'DejaVu Sans Mono', monospace"

const NIVEIS = {
  info: { fundo: 'white', borda: '#e0e0e2', texto: '#15141a' },
  aviso: { fundo: '#fffbd6', borda: '#fff5b2', texto: '#715100' },
  erro: { fundo: '#fdf2f5', borda: '#f9dadf', texto: '#a4000f' },
} as const
type Nivel = keyof typeof NIVEIS

const NOME_DO_STATUS: Record<number, string> = {
  200: 'OK', 201: 'Created', 204: 'No Content', 304: 'Not Modified', 400: 'Bad Request',
  401: 'Unauthorized', 404: 'Not Found', 409: 'Conflict', 422: 'Unprocessable Content',
  429: 'Too Many Requests', 500: 'Internal Server Error', 503: 'Service Unavailable',
}

type Aba = 'console' | 'rede'

// O painel inteiro, com as abas do DevTools do Firefox no topo.
export function MiniConsole() {
  const { trechos, limpar } = useEventos()
  const [aba, setAba] = useState<Aba>('rede')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>
      <div style={{ display: 'flex', height: 30, background: '#f9f9fb', borderBottom: '1px solid #e0e0e2', fontFamily: 'system-ui, sans-serif' }}>
        {(['console', 'rede'] as Aba[]).map((nome) => (
          <button
            key={nome}
            onClick={() => setAba(nome)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', padding: '0 12px',
              fontSize: 13, cursor: 'pointer', color: aba === nome ? '#0061e0' : '#15141a',
              borderTop: aba === nome ? '2px solid #0061e0' : '2px solid transparent',
            }}
          >
            {nome === 'console' ? <IconeDoConsole /> : <IconeDaRede />}
            {nome === 'console' ? 'Console' : 'Rede'}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {aba === 'console' ? <PainelDoConsole trechos={trechos} limpar={limpar} /> : <PainelDeRede trechos={trechos} limpar={limpar} />}
      </div>
    </div>
  )
}

function IconeDoConsole() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
      <path d="M4.5 6l2 2-2 2M8 10.5h3.5" />
    </svg>
  )
}

function IconeDaRede() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M5 14V2M2 5l3-3 3 3M11 2v12M8 11l3 3 3-3" />
    </svg>
  )
}

function PainelDoConsole({ trechos, limpar }: { trechos: Trecho[]; limpar: () => void }) {
  const [filtro, setFiltro] = useState('')
  const [niveisAtivos, setNiveisAtivos] = useState<Record<Nivel, boolean>>({ erro: true, aviso: true, info: true })
  const fundo = useRef<HTMLDivElement>(null)

  // Acompanha o último evento, como o console faz.
  useEffect(() => {
    fundo.current?.scrollIntoView({ block: 'end' })
  }, [trechos])

  const visiveis = trechos.filter(
    (trecho) => niveisAtivos[nivelDo(trecho)] && textoDa(trecho).toLowerCase().includes(filtro.toLowerCase()),
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: FONTE, fontSize: 11, background: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 28, padding: '2px 4px', borderBottom: '1px solid #e0e0e2', background: '#f9f9fb', flexWrap: 'wrap', fontFamily: 'system-ui, sans-serif' }}>
        <button onClick={limpar} title="Limpar a saída do console" aria-label="Limpar console" style={estiloDoBotao}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="#5b5b66">
            <path d="M6 1h4a1 1 0 0 1 1 1v1h3v1.5H2V3h3V2a1 1 0 0 1 1-1zm.5 2h3v-.5h-3zM3 5.5h10l-.8 8.6A1 1 0 0 1 11.2 15H4.8a1 1 0 0 1-1-.9zm3 1.5v6h1.2V7zm2.8 0v6H10V7z" />
          </svg>
        </button>
        <input
          value={filtro}
          onChange={(evento) => setFiltro(evento.target.value)}
          placeholder="Filtrar saída"
          style={{ flex: 1, minWidth: 80, height: 22, border: 'none', padding: '0 4px', fontSize: 12, fontFamily: 'inherit', background: 'transparent', outline: 'none', color: '#15141a' }}
        />
        <span style={{ width: 1, height: 16, background: '#e0e0e2' }} />
        {(['erro', 'aviso', 'info'] as Nivel[]).map((nivel) => (
          <button
            key={nivel}
            onClick={() => setNiveisAtivos({ ...niveisAtivos, [nivel]: !niveisAtivos[nivel] })}
            style={{
              ...estiloDoBotao, width: 'auto', padding: '0 6px', fontSize: 12, fontFamily: 'inherit',
              background: niveisAtivos[nivel] ? '#e0e0e6' : 'transparent', color: '#15141a',
            }}
          >
            {{ erro: 'Erros', aviso: 'Avisos', info: 'Logs' }[nivel]}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {visiveis.map((trecho) => (
          <Linha key={trecho.id} trecho={trecho} />
        ))}
        <div ref={fundo} style={{ padding: '3px 6px', color: '#0074e8' }}>
          <span>»</span>
        </div>
      </div>
    </div>
  )
}

const estiloDoBotao: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 22,
  border: 'none', borderRadius: 2, background: 'transparent', cursor: 'pointer', padding: 0,
}

function nivelDo(trecho: Trecho): Nivel {
  if (trecho.instantaneo || trecho.fim === undefined) return 'info'
  const status = Number(trecho.detalhe)
  if (trecho.resultado === 'erro' && status >= 400 && status < 500) return 'aviso'
  if (trecho.resultado === 'erro') return 'erro'
  if (trecho.resultado === 'cancelada') return 'aviso'
  return 'info'
}

// O texto da linha, no formato que o Chrome usa para requisições.
function textoDa(trecho: Trecho) {
  if (trecho.instantaneo) return trecho.rotulo
  if (trecho.fim === undefined) return `${trecho.rotulo} [pendente]`
  const duracao = `${Math.round(trecho.fim - trecho.inicio)}ms`
  if (trecho.resultado === 'cancelada') return `${trecho.rotulo} [cancelada ${duracao}]`
  const status = Number(trecho.detalhe)
  if (status) return `${trecho.rotulo} [HTTP/1.1 ${status} ${NOME_DO_STATUS[status] ?? ''} ${duracao}]`
  return `${trecho.rotulo} [${[trecho.detalhe, duracao].filter(Boolean).join(' ')}]`
}

function Linha({ trecho }: { trecho: Trecho }) {
  const [aberta, setAberta] = useState(false)
  const nivel = nivelDo(trecho)
  const cores = NIVEIS[nivel]
  const detalhes = trecho.resposta ?? trecho.requisicao
  const expansivel = Boolean(detalhes && (detalhes.corpo || detalhes.cabecalhos))
  const emCache = trecho.estilo === 'cache'
  const origem = trecho.de ? `${trecho.de} → ${trecho.faixa}` : trecho.faixa

  return (
    <div style={{ background: cores.fundo, borderTop: `1px solid ${cores.borda}`, marginTop: -1, color: cores.texto }}>
      <div
        onClick={expansivel ? () => setAberta(!aberta) : undefined}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 4, padding: '3px 6px', paddingLeft: trecho.pai ? 22 : 6, cursor: expansivel ? 'pointer' : 'default', lineHeight: '15px' }}
      >
        <span style={{ width: 12, flexShrink: 0, textAlign: 'center' }}>
          {nivel === 'erro' && <IconeDeErro />}
          {nivel === 'aviso' && <IconeDeAviso />}
        </span>
        <span style={{ width: 8, flexShrink: 0, color: '#727272', fontSize: 11 }}>
          {expansivel ? (aberta ? '▾' : '▸') : ''}
        </span>
        <span style={{ color: '#8f8f9d', flexShrink: 0 }}>{hora(trecho.inicio)}</span>
        <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap', color: emCache ? '#058b00' : undefined }}>
          {textoDa(trecho)}
        </span>
        <span style={{ flexShrink: 0, color: '#5b5b66' }}>{origem}</span>
      </div>

      {aberta && detalhes && (
        <div style={{ padding: '0 6px 4px 52px', color: '#303942' }}>
          {detalhes.status !== undefined && <Propriedade nome="status" valor={String(detalhes.status)} cor="#1a1aa6" />}
          {detalhes.origem && <Propriedade nome="origem" valor={`"${detalhes.origem}"`} cor="#c80000" />}
          {detalhes.bytes !== undefined && <Propriedade nome="bytes" valor={String(detalhes.bytes)} cor="#1a1aa6" />}
          {detalhes.cabecalhos &&
            Object.entries(detalhes.cabecalhos).map(([nome, valor]) => (
              <Propriedade key={nome} nome={nome} valor={`"${valor}"`} cor="#c80000" />
            ))}
          {detalhes.corpo && <Propriedade nome="corpo" valor={detalhes.corpo} cor="#c80000" />}
        </div>
      )}
    </div>
  )
}

function Propriedade({ nome, valor, cor }: { nome: string; valor: string; cor: string }) {
  return (
    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '15px' }}>
      <span style={{ color: '#0074e8' }}>{nome}</span>: <span style={{ color: cor }}>{valor}</span>
    </div>
  )
}

function hora(em: number) {
  const data = new Date(em)
  return data.toLocaleTimeString('pt-BR', { hour12: false }) + '.' + String(data.getMilliseconds()).padStart(3, '0')
}

function IconeDeErro() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" style={{ marginTop: 2 }}>
      <circle cx="6" cy="6" r="6" fill="#d70022" />
      <path d="M6 2.8v4M6 8.4v1" stroke="white" strokeWidth="1.4" />
    </svg>
  )
}

function IconeDeAviso() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" style={{ marginTop: 2 }}>
      <path d="M6 0.5L11.8 11H0.2z" fill="#ffa436" />
      <path d="M6 4v3.5M6 8.8v1" stroke="white" strokeWidth="1.3" />
    </svg>
  )
}
