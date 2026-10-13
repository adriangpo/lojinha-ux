import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Faixa } from '../lib/monitor'
import type { Trecho } from '../monitor/useEventos'

// Imita a aba Rede do Firefox: uma linha por requisição (ou consulta ao banco), com detalhes ao clicar.

const FONTE = "system-ui, -apple-system, 'Segoe UI', sans-serif"
const BORDA = '#e0e0e2'

const FILTROS: { nome: string; faixa?: Faixa }[] = [
  { nome: 'Tudo' },
  { nome: 'Navegador', faixa: 'navegador' },
  { nome: 'API', faixa: 'api' },
  { nome: 'Banco', faixa: 'banco' },
]

const COLUNAS = '52px 58px minmax(0, 1fr) 72px 56px 68px'

export function PainelDeRede({ trechos, limpar }: { trechos: Trecho[]; limpar: () => void }) {
  const [filtro, setFiltro] = useState('')
  const [faixa, setFaixa] = useState<Faixa | undefined>()
  const [selecionado, setSelecionado] = useState<string>()
  const fundo = useRef<HTMLDivElement>(null)

  const requisicoes = trechos.filter(
    (trecho) =>
      !trecho.instantaneo &&
      trecho.estilo !== 'espera' &&
      (!faixa || trecho.faixa === faixa) &&
      trecho.rotulo.toLowerCase().includes(filtro.toLowerCase()),
  )
  const escolhida = requisicoes.find((trecho) => trecho.id === selecionado)

  useEffect(() => {
    fundo.current?.scrollIntoView({ block: 'end' })
  }, [requisicoes.length])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, fontFamily: FONTE, fontSize: 12, color: '#15141a' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 28, padding: '0 4px', borderBottom: `1px solid ${BORDA}` }}>
        <button onClick={limpar} title="Limpar" aria-label="Limpar" style={estiloDoIcone}>
          <IconeDeLixeira />
        </button>
        <span style={{ color: '#8f8f9d', fontSize: 12 }}>⏷</span>
        <input
          value={filtro}
          onChange={(evento) => setFiltro(evento.target.value)}
          placeholder="Filtrar URLs"
          style={{ flex: 1, minWidth: 0, height: 22, border: 'none', fontSize: 12, fontFamily: FONTE, outline: 'none', background: 'transparent' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 2, padding: '3px 6px', borderBottom: `1px solid ${BORDA}` }}>
        {FILTROS.map((opcao) => {
          const ativo = opcao.faixa === faixa
          return (
            <button
              key={opcao.nome}
              onClick={() => setFaixa(opcao.faixa)}
              style={{
                border: 'none', background: 'transparent', padding: '2px 6px', fontSize: 12, fontFamily: FONTE, cursor: 'pointer',
                color: ativo ? '#0061e0' : '#15141a', borderBottom: ativo ? '2px solid #0061e0' : '2px solid transparent',
              }}
            >
              {opcao.nome}
            </button>
          )
        })}
      </div>

      <div style={{ ...estiloDaGrade, background: '#f9f9fb', borderBottom: `1px solid ${BORDA}`, color: '#15141a' }}>
        {['Status', 'Método', 'Arquivo', 'Iniciador', 'Transf.', 'Tempo'].map((titulo) => (
          <span key={titulo} style={estiloDaCelula}>
            {titulo}
          </span>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {requisicoes.map((trecho, indice) => (
          <LinhaDaRede
            key={trecho.id}
            trecho={trecho}
            par={indice % 2 === 1}
            selecionada={trecho.id === selecionado}
            aoClicar={() => setSelecionado(trecho.id === selecionado ? undefined : trecho.id)}
          />
        ))}
        <div ref={fundo} />
      </div>

      <div style={{ height: 22, display: 'flex', alignItems: 'center', padding: '0 8px', borderTop: `1px solid ${BORDA}`, color: '#5b5b66', fontSize: 11 }}>
        {requisicoes.length} {requisicoes.length === 1 ? 'requisição' : 'requisições'}
      </div>

      {escolhida && <Detalhes trecho={escolhida} fechar={() => setSelecionado(undefined)} />}
    </div>
  )
}

const estiloDaGrade: CSSProperties = { display: 'grid', gridTemplateColumns: COLUNAS, alignItems: 'center', height: 24 }
const estiloDaCelula: CSSProperties = {
  padding: '0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderRight: `1px solid ${BORDA}`, lineHeight: '24px',
}
const estiloDoIcone: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 22, border: 'none', borderRadius: 2,
  background: 'transparent', cursor: 'pointer', padding: 0,
}

// "POST /novos-produtos?x=1" → método, arquivo e caminho. Consultas ao banco viram "SQL".
function partesDo(trecho: Trecho) {
  const [primeira, ...resto] = trecho.rotulo.split(' ')
  if (trecho.faixa === 'banco') return { metodo: 'SQL', arquivo: trecho.rotulo, caminho: trecho.rotulo }
  const caminho = resto.join(' ')
  const arquivo = caminho.split('?')[0].split('/').filter(Boolean).at(-1) ?? '/'
  return { metodo: primeira, arquivo: arquivo + (caminho.includes('?') ? '?' + caminho.split('?')[1] : ''), caminho }
}

function iniciadorDo(trecho: Trecho) {
  if (trecho.faixa === 'navegador') return trecho.rotulo.match(/\.(png|jpe?g|webp|svg)/) ? 'img' : 'fetch'
  if (trecho.faixa === 'api') return 'servidor'
  return 'api'
}

function bytesFormatados(bytes?: number) {
  if (bytes === undefined) return '—'
  if (bytes === 0) return 'cache'
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} kB`
}

function LinhaDaRede({ trecho, par, selecionada, aoClicar }: { trecho: Trecho; par: boolean; selecionada: boolean; aoClicar: () => void }) {
  const { metodo, arquivo, caminho } = partesDo(trecho)
  const pendente = trecho.fim === undefined
  const cancelada = trecho.resultado === 'cancelada'
  const fundo = selecionada ? '#0061e0' : par ? '#f9f9fb' : 'white'
  const texto = selecionada ? 'white' : cancelada ? '#8f8f9d' : '#15141a'

  return (
    <div onClick={aoClicar} style={{ ...estiloDaGrade, background: fundo, color: texto, cursor: 'pointer' }} title={caminho}>
      <span style={estiloDaCelula}>
        <PillDeStatus trecho={trecho} />
      </span>
      <span style={estiloDaCelula}>{metodo}</span>
      <span style={{ ...estiloDaCelula, textDecoration: cancelada ? 'line-through' : undefined }}>{arquivo}</span>
      <span style={{ ...estiloDaCelula, color: selecionada ? 'white' : '#0061e0' }}>{iniciadorDo(trecho)}</span>
      <span style={estiloDaCelula}>
        {trecho.faixa === 'banco' ? trecho.detalhe?.replace(' linhas', ' lin.') : bytesFormatados(trecho.resposta?.bytes)}
      </span>
      <span style={{ ...estiloDaCelula, borderRight: 'none', textAlign: 'right' }}>
        {pendente ? '…' : `${Math.round(trecho.fim! - trecho.inicio)} ms`}
      </span>
    </div>
  )
}

function PillDeStatus({ trecho }: { trecho: Trecho }) {
  const status = Number(trecho.detalhe)
  if (trecho.fim === undefined) return <span style={{ color: '#8f8f9d' }}>—</span>
  if (trecho.resultado === 'cancelada') return <span style={{ color: '#8f8f9d' }}>NS</span>

  let cor = '#058b00'
  let texto = status ? String(status) : trecho.resultado === 'erro' ? 'erro' : 'ok'
  if (trecho.estilo === 'cache' || trecho.resposta?.origem === 'cache') {
    cor = '#5b5b66'
    texto = status ? String(status) : 'cache'
  } else if (trecho.resposta?.origem === '304') {
    // O fetch entrega 200 para o JavaScript mesmo quando o servidor respondeu 304:
    // a medição de rede (só cabeçalhos trafegaram) é que conta a verdade.
    cor = '#0074e8'
    texto = '304'
  } else if (status >= 500 || (trecho.resultado === 'erro' && !status)) cor = '#d70022'
  else if (status >= 400) cor = '#b833e1'
  else if (status >= 300) cor = '#0074e8'

  return (
    <span style={{ display: 'inline-block', minWidth: 30, padding: '0 4px', borderRadius: 3, background: cor, color: 'white', fontSize: 11, lineHeight: '16px', textAlign: 'center', fontWeight: 600 }}>
      {texto}
    </span>
  )
}

function Detalhes({ trecho, fechar }: { trecho: Trecho; fechar: () => void }) {
  const [aba, setAba] = useState<'cabecalhos' | 'resposta' | 'requisicao'>('cabecalhos')
  const resposta = trecho.resposta
  const requisicao = trecho.requisicao

  return (
    <div style={{ height: '45%', display: 'flex', flexDirection: 'column', borderTop: `1px solid ${BORDA}` }}>
      <div style={{ display: 'flex', alignItems: 'center', background: '#f9f9fb', borderBottom: `1px solid ${BORDA}` }}>
        {(['cabecalhos', 'requisicao', 'resposta'] as const).map((nome) => (
          <button
            key={nome}
            onClick={() => setAba(nome)}
            style={{
              border: 'none', background: 'transparent', padding: '5px 10px', fontSize: 12, fontFamily: FONTE, cursor: 'pointer',
              color: aba === nome ? '#0061e0' : '#15141a', borderBottom: aba === nome ? '2px solid #0061e0' : '2px solid transparent',
            }}
          >
            {{ cabecalhos: 'Cabeçalhos', requisicao: 'Requisição', resposta: 'Resposta' }[nome]}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button onClick={fechar} aria-label="Fechar detalhes" style={{ ...estiloDoIcone, fontSize: 14, color: '#5b5b66' }}>
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px', fontSize: 11 }}>
        {aba === 'cabecalhos' && (
          <>
            <Campo nome="Endereço" valor={partesDo(trecho).caminho} />
            {trecho.detalhe && <Campo nome="Status" valor={trecho.detalhe} />}
            {resposta?.origem && <Campo nome="Origem" valor={resposta.origem} />}
            {resposta?.bytes !== undefined && <Campo nome="Transferido" valor={bytesFormatados(resposta.bytes)} />}
            {trecho.fim !== undefined && <Campo nome="Tempo" valor={`${Math.round(trecho.fim - trecho.inicio)} ms`} />}
            {resposta?.cabecalhos && <Secao titulo="Cabeçalhos da resposta" valores={resposta.cabecalhos} />}
            {requisicao?.cabecalhos && <Secao titulo="Cabeçalhos da requisição" valores={requisicao.cabecalhos} />}
          </>
        )}
        {aba === 'requisicao' && <Corpo texto={requisicao?.corpo} />}
        {aba === 'resposta' && <Corpo texto={resposta?.corpo} />}
      </div>
    </div>
  )
}

function Campo({ nome, valor }: { nome: string; valor: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, lineHeight: '18px' }}>
      <span style={{ color: '#5b5b66', minWidth: 80, fontWeight: 600 }}>{nome}</span>
      <span style={{ wordBreak: 'break-all' }}>{valor}</span>
    </div>
  )
}

function Secao({ titulo, valores }: { titulo: string; valores: Record<string, string> }) {
  return (
    <>
      <div style={{ marginTop: 8, marginBottom: 2, fontWeight: 600 }}>{titulo}</div>
      {Object.entries(valores).map(([nome, valor]) => (
        <div key={nome} style={{ lineHeight: '17px', wordBreak: 'break-all', fontFamily: 'Menlo, Consolas, monospace' }}>
          <span style={{ color: '#5b5b66' }}>{nome}: </span>
          {valor}
        </div>
      ))}
    </>
  )
}

// Formata JSON quando dá, como a aba Resposta do Firefox.
function Corpo({ texto }: { texto?: string }) {
  if (!texto) return <span style={{ color: '#8f8f9d' }}>Sem corpo.</span>
  let formatado = texto
  try {
    formatado = JSON.stringify(JSON.parse(texto), null, 2)
  } catch {
    // não é JSON: mostra como veio
  }
  return <pre style={{ margin: 0, fontFamily: 'Menlo, Consolas, monospace', fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{formatado}</pre>
}

function IconeDeLixeira() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="#5b5b66">
      <path d="M6 1h4a1 1 0 0 1 1 1v1h3v1.5H2V3h3V2a1 1 0 0 1 1-1zm.5 2h3v-.5h-3zM3 5.5h10l-.8 8.6A1 1 0 0 1 11.2 15H4.8a1 1 0 0 1-1-.9zm3 1.5v6h1.2V7zm2.8 0v6H10V7z" />
    </svg>
  )
}
