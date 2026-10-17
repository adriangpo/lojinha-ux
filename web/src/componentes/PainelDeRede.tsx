import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Faixa } from '../lib/monitor'
import type { Trecho } from '../monitor/useEventos'
import { bytesFormatados, DetalhesDaRede } from './DetalhesDaRede'

// Imita a aba Rede do Firefox: uma linha por requisição (ou consulta ao banco), com detalhes ao clicar.

const FONTE = "system-ui, -apple-system, 'Segoe UI', sans-serif"
const BORDA = '#e0e0e2'

const FILTROS: { nome: string; faixa?: Faixa }[] = [
  { nome: 'Tudo' },
  { nome: 'Navegador', faixa: 'navegador' },
  { nome: 'API', faixa: 'api' },
  { nome: 'Banco', faixa: 'banco' },
]

// O "OK" das consultas e a etiqueta BANCO usam o mesmo azul: trocando aqui, mudam juntos.
const AZUL_DO_BANCO = '#1c7ed6'

// Uma cor por camada, para seguir a requisição do navegador até o banco.
export const CAMADAS: Partial<Record<Faixa, { nome: string; texto: string; fundo: string }>> = {
  navegador: { nome: 'NAVEGADOR', texto: '#b4450c', fundo: '#fff0e0' },
  api: { nome: 'API', texto: '#6b21a8', fundo: '#f1e6ff' },
  banco: { nome: 'BANCO', texto: AZUL_DO_BANCO, fundo: '#e7f5ff' },
}

const COLUNAS = '52px 58px minmax(0, 1fr) 72px 56px 68px'

export function PainelDeRede({ trechos, limpar }: { trechos: Trecho[]; limpar: () => void }) {
  const [filtro, setFiltro] = useState('')
  // Faixas marcadas nos filtros; vazio é "Tudo".
  const [faixas, setFaixas] = useState<Faixa[]>([])
  const [selecionado, setSelecionado] = useState<string>()
  const lista = useRef<HTMLDivElement>(null)

  const requisicoes = trechos.filter(
    (trecho) =>
      !trecho.instantaneo &&
      trecho.estilo !== 'espera' &&
      (faixas.length === 0 || faixas.includes(trecho.faixa)) &&
      trecho.rotulo.toLowerCase().includes(filtro.toLowerCase()),
  )
  const escolhida = requisicoes.find((trecho) => trecho.id === selecionado)

  // Rola só a lista até a última linha (scrollIntoView rolaria a página junto).
  useEffect(() => {
    if (lista.current) lista.current.scrollTop = lista.current.scrollHeight
  }, [requisicoes.length])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        fontFamily: FONTE,
        fontSize: 12,
        color: '#15141a',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          height: 28,
          padding: '0 4px',
          borderBottom: `1px solid ${BORDA}`,
        }}
      >
        <button onClick={limpar} title="Limpar" aria-label="Limpar" style={estiloDoIcone}>
          <IconeDeLixeira />
        </button>
        <span style={{ color: '#8f8f9d', fontSize: 12 }}>⏷</span>
        <input
          value={filtro}
          onChange={(evento) => setFiltro(evento.target.value)}
          placeholder="Filtrar URLs"
          style={{
            flex: 1,
            minWidth: 0,
            height: 22,
            border: 'none',
            fontSize: 12,
            fontFamily: FONTE,
            outline: 'none',
            background: 'transparent',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: '3px 6px',
          borderBottom: `1px solid ${BORDA}`,
        }}
      >
        {FILTROS.map((opcao) => {
          const faixa = opcao.faixa
          const ativo = faixa ? faixas.includes(faixa) : faixas.length === 0
          return (
            <button
              key={opcao.nome}
              // Como no Firefox: cada tipo liga e desliga sozinho; "Tudo" desmarca os outros.
              onClick={() => setFaixas(!faixa ? [] : ativo ? faixas.filter((f) => f !== faixa) : [...faixas, faixa])}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '2px 6px',
                fontSize: 12,
                fontFamily: FONTE,
                color: ativo ? '#0061e0' : '#15141a',
                borderBottom: ativo ? '2px solid #0061e0' : '2px solid transparent',
              }}
            >
              {/* O pontinho serve de legenda para as etiquetas da coluna Camada. */}
              {opcao.faixa && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    marginRight: 5,
                    background: CAMADAS[opcao.faixa]?.texto,
                  }}
                />
              )}
              {opcao.nome}
            </button>
          )
        })}
      </div>

      <div
        style={{
          ...estiloDaGrade,
          background: '#f9f9fb',
          borderBottom: `1px solid ${BORDA}`,
          color: '#15141a',
        }}
      >
        {['Status', 'Método', 'Arquivo', 'Camada', 'Transf.', 'Tempo'].map((titulo) => (
          <span key={titulo} style={estiloDaCelula}>
            {titulo}
          </span>
        ))}
      </div>

      {/* overscrollBehavior: no fim da lista, a roda do mouse não passa para a página. */}
      <div
        ref={lista}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
        }}
      >
        {requisicoes.map((trecho, indice) => (
          <LinhaDaRede
            key={trecho.id}
            trecho={trecho}
            par={indice % 2 === 1}
            selecionada={trecho.id === selecionado}
            aoClicar={() => setSelecionado(trecho.id === selecionado ? undefined : trecho.id)}
          />
        ))}
      </div>

      <div
        style={{
          height: 22,
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          borderTop: `1px solid ${BORDA}`,
          color: '#5b5b66',
          fontSize: 11,
        }}
      >
        {requisicoes.length} {requisicoes.length === 1 ? 'requisição' : 'requisições'}
      </div>

      {escolhida && <DetalhesDaRede trecho={escolhida} fechar={() => setSelecionado(undefined)} />}
    </div>
  )
}

const estiloDaGrade: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: COLUNAS,
  alignItems: 'center',
  height: 24,
}
const estiloDaCelula: CSSProperties = {
  padding: '0 6px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  borderRight: `1px solid ${BORDA}`,
  lineHeight: '24px',
}
const estiloDoIcone: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 22,
  border: 'none',
  borderRadius: 2,
  background: 'transparent',
  padding: 0,
}

// "POST /novos-produtos?x=1" → método, arquivo e caminho. Consultas ao banco viram "SQL".
function partesDo(trecho: Trecho) {
  const [primeira, ...resto] = trecho.rotulo.split(' ')
  if (trecho.faixa === 'banco') return { metodo: 'SQL', arquivo: trecho.rotulo, caminho: trecho.rotulo }
  const caminho = resto.join(' ')
  const arquivo = caminho.split('?')[0].split('/').filter(Boolean).at(-1) ?? '/'
  return {
    metodo: primeira,
    arquivo: arquivo + (caminho.includes('?') ? '?' + caminho.split('?')[1] : ''),
    caminho,
  }
}

function LinhaDaRede({ trecho, par, selecionada, aoClicar }: { trecho: Trecho; par: boolean; selecionada: boolean; aoClicar: () => void }) {
  const { metodo, arquivo, caminho } = partesDo(trecho)
  const pendente = trecho.fim === undefined
  const cancelada = trecho.resultado === 'cancelada'
  // Realce ao passar o mouse, como na aba Rede do navegador.
  const [sobre, setSobre] = useState(false)
  const fundo = selecionada ? '#0061e0' : sobre ? '#e0e0e6' : par ? '#f9f9fb' : 'white'
  const texto = selecionada ? 'white' : cancelada ? '#8f8f9d' : '#15141a'
  const camada = CAMADAS[trecho.faixa]

  return (
    <div
      onClick={aoClicar}
      onMouseEnter={() => setSobre(true)}
      onMouseLeave={() => setSobre(false)}
      style={{
        ...estiloDaGrade,
        background: fundo,
        color: texto,
      }}
      title={caminho}
    >
      <span style={estiloDaCelula}>
        <PillDeStatus trecho={trecho} />
      </span>
      <span style={estiloDaCelula}>{metodo}</span>
      <span
        style={{
          ...estiloDaCelula,
          textDecoration: cancelada ? 'line-through' : undefined,
        }}
      >
        {arquivo}
      </span>
      <span style={estiloDaCelula}>
        {/* Se não couber, corta com reticências ("NAVE…"), como as outras células. */}
        <span
          style={{
            display: 'inline-block',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            verticalAlign: 'middle',
            padding: '0 6px',
            lineHeight: '16px',
            borderRadius: 8,
            fontSize: 10,
            fontWeight: 600,
            color: camada?.texto,
            background: camada?.fundo,
          }}
        >
          {camada?.nome}
        </span>
      </span>
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
  if (trecho.fim === undefined) return <span style={{ color: '#8f8f9d' }}>-</span>
  if (trecho.resultado === 'cancelada') return <span style={{ color: '#8f8f9d' }}>NS</span>

  // Sucesso: verde nas requisições, como no navegador; "OK" azul nas consultas ao banco.
  let cor = trecho.faixa === 'banco' ? AZUL_DO_BANCO : '#058b00'
  let texto = status ? String(status) : trecho.resultado === 'erro' ? 'erro' : 'OK'
  if (trecho.estilo === 'cache' || trecho.resposta?.origem === 'cache') {
    cor = '#5b5b66'
    texto = status ? String(status) : 'cache'
  } else if (trecho.resposta?.origem === '304') {
    // O fetch entrega 200 para o JavaScript mesmo quando o servidor respondeu 304:
    // a medição de rede (só cabeçalhos trafegaram) é que conta a verdade.
    // Verde-água, como no monitor (o azul ficou para o banco).
    cor = '#0c8599'
    texto = '304'
  } else if (status >= 500 || (trecho.resultado === 'erro' && !status)) cor = '#d70022'
  else if (status >= 400) cor = '#b833e1'
  else if (status >= 300) cor = '#0c8599'

  return (
    <span
      style={{
        display: 'inline-block',
        minWidth: 30,
        padding: '0 4px',
        borderRadius: 3,
        background: cor,
        color: 'white',
        fontSize: 11,
        lineHeight: '16px',
        textAlign: 'center',
        fontWeight: 600,
      }}
    >
      {texto}
    </span>
  )
}

function IconeDeLixeira() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="#5b5b66">
      <path d="M6 1h4a1 1 0 0 1 1 1v1h3v1.5H2V3h3V2a1 1 0 0 1 1-1zm.5 2h3v-.5h-3zM3 5.5h10l-.8 8.6A1 1 0 0 1 11.2 15H4.8a1 1 0 0 1-1-.9zm3 1.5v6h1.2V7zm2.8 0v6H10V7z" />
    </svg>
  )
}
