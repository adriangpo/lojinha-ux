import { Box, Group, Paper, Text, Tooltip } from '@mantine/core'
import { useRef, useState } from 'react'
import { useRelogio } from '../../hooks/useRelogio'

type Resposta = { progresso: number; novidade: boolean } | { erro: true }

type Pergunta = {
  numero: number
  saiu: number
  voltou?: number
  resposta?: Resposta
}

// Anota cada pergunta à API: quando saiu e, quando voltar, se trouxe novidade.
export function usePerguntas() {
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [inicio, setInicio] = useState(0)
  const proximoNumero = useRef(1)

  function recomecar() {
    setPerguntas([])
    setInicio(Date.now())
    proximoNumero.current = 1
  }

  // Devolve a função que anota a resposta desta pergunta.
  function perguntar() {
    const numero = proximoNumero.current++
    setPerguntas((atuais) => [...atuais, { numero, saiu: Date.now() }])
    return (resposta: Resposta) =>
      setPerguntas((atuais) => atuais.map((p) => (p.numero === numero ? { ...p, voltou: Date.now(), resposta } : p)))
  }

  return { perguntas, inicio, recomecar, perguntar }
}

// Escala fixa para comparar as versões: o processamento leva uns 12s.
const ESCALA = 14_000

const COR = {
  novidade: 'var(--mantine-color-green-6)',
  repetida: 'var(--mantine-color-gray-5)',
  esperando: 'var(--mantine-color-blue-4)',
  erro: 'var(--mantine-color-red-6)',
}

const segundos = (ms: number) => `${(ms / 1000).toFixed(1).replace('.', ',')}s`

// Cada pergunta é uma barra: começa quando saiu e termina quando a resposta voltou.
// Short polling: tracinhos espaçados, alguns cinzas. Long polling: uma barra só, aberta até terminar.
export function LinhaDasPerguntas({ perguntas, inicio }: { perguntas: Pergunta[]; inicio: number }) {
  const esperando = perguntas.find((p) => p.voltou === undefined)
  const agora = useRelogio(esperando !== undefined)

  const fimDe = (p: Pergunta) => p.voltou ?? agora
  const escala = Math.max(ESCALA, ...perguntas.map((p) => fimDe(p) - inicio))
  const posicao = (instante: number) => ((instante - inicio) / escala) * 100

  const comNovidade = perguntas.filter((p) => p.resposta && 'novidade' in p.resposta && p.resposta.novidade).length
  const repetidas = perguntas.filter((p) => p.resposta && 'novidade' in p.resposta && !p.resposta.novidade).length

  return (
    <Paper withBorder p="sm">
      <Group justify="space-between" mb={4}>
        <Text size="xs" c="dimmed">
          0s
        </Text>
        <Text size="xs" c="dimmed">
          {segundos(escala)}
        </Text>
      </Group>

      <Box pos="relative" h={24} bg="var(--mantine-color-default-hover)" style={{ borderRadius: 4, overflow: 'hidden' }}>
        {perguntas.map((p) => {
          const esquerda = posicao(p.saiu)
          const largura = posicao(fimDe(p)) - esquerda
          const cor = !p.resposta
            ? COR.esperando
            : 'erro' in p.resposta
              ? COR.erro
              : p.resposta.novidade
                ? COR.novidade
                : COR.repetida
          return (
            <Tooltip key={p.numero} label={descrever(p, fimDe(p))}>
              {/* O -2px separa as barras coladas do long polling. */}
              <Box
                pos="absolute"
                top={4}
                bottom={4}
                left={`${esquerda}%`}
                w={`max(3px, calc(${largura}% - 2px))`}
                style={{ background: cor, borderRadius: 3 }}
              />
            </Tooltip>
          )
        })}
      </Box>

      <Text fw={600} mt="xs">
        Perguntas à API: {perguntas.length} · com novidade: {comNovidade} · repetidas: {repetidas}
      </Text>
      {esperando && (
        <Text size="sm" c="dimmed">
          Uma pergunta esperando resposta há {segundos(agora - esperando.saiu)}
        </Text>
      )}
      <Group gap="md" mt={4}>
        <Legenda cor={COR.novidade} texto="trouxe novidade" />
        <Legenda cor={COR.repetida} texto="veio repetida" />
        <Legenda cor={COR.esperando} texto="esperando" />
      </Group>
    </Paper>
  )
}

function descrever(p: Pergunta, fim: number) {
  const espera = `esperou ${segundos(fim - p.saiu)}`
  if (!p.resposta) return `#${p.numero} · ${espera}…`
  if ('erro' in p.resposta) return `#${p.numero} · ${espera} · falhou`
  return `#${p.numero} · ${espera} · ${p.resposta.progresso}% (${p.resposta.novidade ? 'novidade' : 'repetida'})`
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <Group gap={6}>
      <Box w={10} h={10} style={{ background: cor, borderRadius: 2 }} />
      <Text size="xs" c="dimmed">
        {texto}
      </Text>
    </Group>
  )
}
