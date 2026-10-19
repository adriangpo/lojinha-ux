import { Box, Group, Paper, Text } from '@mantine/core'
import { useRelogio } from '../hooks/useRelogio'
import { aparenciaDoTrecho, COR_DA_MARCA, FAIXAS } from './aparencia'
import type { Trecho } from './useEventos'

const ALTURA_DA_LINHA = 26
const LARGURA_DO_NOME = 110

type Props = {
  trechos: Trecho[]
  janela: number
  selecionado?: string
  aoSelecionar?: (trecho: Trecho) => void
}

// Linha do tempo: cada trecho é uma barra que cresce enquanto está em andamento.
export function Barras({ trechos, janela, selecionado, aoSelecionar }: Props) {
  const emAndamento = trechos.some((trecho) => trecho.fim === undefined)
  const agora = useRelogio(emAndamento)

  // O "agora" é o relógio enquanto algo está em andamento. Parado, congela no último evento.
  const ultimoEvento = Math.max(0, ...trechos.map((trecho) => trecho.fim ?? trecho.inicio))
  const fimDaJanela = emAndamento ? agora : ultimoEvento + 300

  // Como a aba Network do DevTools: a atividade começa na esquerda e cresce para a direita.
  // Quando passa do tamanho da janela, a janela anda junto com o "agora".
  const recentes = trechos.filter((trecho) => (trecho.fim ?? fimDaJanela) >= fimDaJanela - janela)
  const inicioDaJanela =
    recentes.length === 0
      ? fimDaJanela - janela
      : Math.max(fimDaJanela - janela, Math.min(...recentes.map((trecho) => trecho.inicio)) - janela * 0.02)

  const posicao = (instante: number) => ((instante - inicioDaJanela) / janela) * 100
  const visiveis = trechos.filter((trecho) => (trecho.fim ?? fimDaJanela) >= inicioDaJanela)

  return (
    <Paper withBorder p="md">
      <Marcacoes janela={janela} />

      {FAIXAS.map(({ faixa, nome }) => {
        const daFaixa = visiveis.filter((trecho) => trecho.faixa === faixa)
        const { linhaDe, totalDeLinhas } = distribuirEmLinhas(daFaixa, fimDaJanela, janela)

        return (
          <Group key={faixa} gap={0} align="stretch" wrap="nowrap" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            <Text w={LARGURA_DO_NOME} fw={600} py={6} style={{ flexShrink: 0 }}>
              {nome}
            </Text>
            <Box pos="relative" style={{ flex: 1, overflow: 'hidden' }} h={totalDeLinhas * ALTURA_DA_LINHA + 8} my={4}>
              {daFaixa.map((trecho) => {
                const esquerda = Math.max(0, posicao(trecho.inicio))
                const direita = posicao(trecho.fim ?? fimDaJanela)
                return (
                  <Barra
                    key={trecho.id}
                    trecho={trecho}
                    esquerda={esquerda}
                    largura={direita - esquerda}
                    topo={linhaDe.get(trecho.id)! * ALTURA_DA_LINHA}
                    fimDaBarra={trecho.fim ?? fimDaJanela}
                    selecionado={trecho.id === selecionado}
                    aoClicar={aoSelecionar && (() => aoSelecionar(trecho))}
                  />
                )
              })}
            </Box>
          </Group>
        )
      })}
    </Paper>
  )
}

type PropsDaBarra = {
  trecho: Trecho
  esquerda: number
  largura: number
  topo: number
  fimDaBarra: number
  selecionado: boolean
  aoClicar?: () => void
}

function Barra({ trecho, esquerda, largura, topo, fimDaBarra, selecionado, aoClicar }: PropsDaBarra) {
  const duracao = trecho.fim === undefined ? undefined : trecho.fim - trecho.inicio
  const contorno = selecionado ? '0 0 0 3px var(--mantine-color-yellow-5)' : undefined

  // Ação instantânea (clique, tela mudou, veio do cache, aviso do servidor): traço fino com o texto ao lado.
  if (trecho.instantaneo) {
    const corDaMarca = trecho.estilo === 'cache' ? COR_DA_MARCA.navegador : COR_DA_MARCA[trecho.faixa]
    const prefixo = trecho.de ? '⇠ ' : trecho.estilo === 'cache' ? '⚡ ' : ''
    return (
      <Box
        pos="absolute"
        left={`${esquerda}%`}
        top={topo}
        h={ALTURA_DA_LINHA - 4}
        onClick={aoClicar}
        style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: aoClicar ? 'pointer' : undefined, boxShadow: contorno }}
      >
        <Box w={3} h="100%" style={{ background: corDaMarca }} />
        <Text size="xs" fw={500} style={{ whiteSpace: 'nowrap', color: corDaMarca }}>
          {prefixo}
          {trecho.rotulo}
        </Text>
      </Box>
    )
  }

  const { fundo, borda, texto } = aparenciaDoTrecho(trecho)
  // Barra curta demais para o texto (resposta rápida): o texto vai ao lado, fora da barra.
  const textoAoLado = largura < 6
  const status = trecho.detalhe ? ` · ${trecho.detalhe}` : ''
  const tempo = duracao !== undefined ? ` · ${duracao}ms` : ''
  const porcentagem = trecho.progresso !== undefined && trecho.fim === undefined ? ` · ${Math.round(trecho.progresso * 100)}%` : ''

  return (
    <Box
      pos="absolute"
      left={`${esquerda}%`}
      top={topo}
      w={`max(${largura}%, 4px)`}
      h={ALTURA_DA_LINHA - 4}
      onClick={aoClicar}
      style={{
        background: fundo,
        border: borda,
        boxShadow: contorno,
        borderRadius: 4,
        color: texto,
        fontSize: 12,
        lineHeight: `${ALTURA_DA_LINHA - 4 - (borda ? 4 : 0)}px`,
        padding: '0 6px',
        whiteSpace: 'nowrap',
        overflow: textoAoLado ? 'visible' : 'hidden',
        textOverflow: 'ellipsis',
        textDecoration: trecho.resultado === 'cancelada' ? 'line-through' : undefined,
        cursor: aoClicar ? 'pointer' : undefined,
      }}
    >
      {/* Progresso: a parte já feita fica mais escura. */}
      {trecho.progresso !== undefined && trecho.fim === undefined && (
        <Box pos="absolute" left={0} top={0} bottom={0} w={`${trecho.progresso * 100}%`} bg="rgba(0, 0, 0, 0.25)" />
      )}
      {/* Um tique para cada aviso que chegou por esta conexão. */}
      {trecho.tiques.map((instante) => (
        <Box
          key={instante}
          pos="absolute"
          top={0}
          bottom={0}
          w={2}
          bg="white"
          left={`${((instante - trecho.inicio) / Math.max(1, fimDaBarra - trecho.inicio)) * 100}%`}
        />
      ))}
      <span
        style={
          textoAoLado
            ? { position: 'absolute', left: 'calc(100% + 4px)', color: 'var(--mantine-color-dark-6)' }
            : { position: 'relative' }
        }
      >
        {trecho.rotulo}
        {status}
        {tempo}
        {porcentagem}
      </span>
    </Box>
  )
}

// Régua de tempo: segundos contados a partir do começo da janela.
function Marcacoes({ janela }: { janela: number }) {
  const passo = janela <= 10_000 ? 1000 : 5000
  const marcas = Array.from({ length: Math.floor(janela / passo) + 1 }, (_, i) => i * passo)

  return (
    <Group gap={0} wrap="nowrap" mb={4}>
      <Box w={LARGURA_DO_NOME} style={{ flexShrink: 0 }} />
      <Box pos="relative" h={18} style={{ flex: 1 }}>
        {marcas.map((ms) => (
          <Text key={ms} size="xs" c="dimmed" pos="absolute" left={`${(ms / janela) * 100}%`} style={{ transform: 'translateX(-50%)' }}>
            {ms / 1000}s
          </Text>
        ))}
      </Box>
    </Group>
  )
}

// Trechos ao mesmo tempo na mesma faixa vão para linhas diferentes, para não se sobreporem.
function distribuirEmLinhas(trechos: Trecho[], fimDaJanela: number, janela: number) {
  const espacoMinimo = janela * 0.15
  const fimDaLinha: number[] = []
  const linhaDe = new Map<string, number>()

  for (const trecho of [...trechos].sort((a, b) => a.inicio - b.inicio)) {
    const fim = Math.max(trecho.fim ?? fimDaJanela, trecho.inicio + espacoMinimo)
    let linha = fimDaLinha.findIndex((ocupadaAte) => ocupadaAte <= trecho.inicio)
    if (linha === -1) linha = fimDaLinha.length
    fimDaLinha[linha] = fim
    linhaDe.set(trecho.id, linha)
  }

  return { linhaDe, totalDeLinhas: Math.max(1, fimDaLinha.length) }
}
