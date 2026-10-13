import { Box, Group, Paper, Stack, Text } from '@mantine/core'
import { useEffect, useRef, useState, type UIEvent } from 'react'

const ITENS = Array.from({ length: 100 }, (_, i) => `Item ${i + 1}`)

// O "trabalho caro" de um handler de scroll de verdade (medir elementos, recalcular layout...).
// Aqui é só uma espera ocupada de ~15ms: o navegador fica travado enquanto ela roda.
export function trabalhoCaro(porcentagem: number) {
  const fim = performance.now() + 15
  while (performance.now() < fim) {
    // ocupado
  }
  return porcentagem
}

export function porcentagemDoScroll(evento: UIEvent<HTMLDivElement>) {
  const { scrollTop, scrollHeight, clientHeight } = evento.currentTarget
  return Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
}

// Conta os eventos e as execuções do handler, guardando quando cada um aconteceu (para a linha do tempo).
export function useMedicao() {
  const [eventos, setEventos] = useState(0)
  const [execucoes, setExecucoes] = useState(0)
  const tempos = useRef({ eventos: [] as number[], execucoes: [] as number[] })

  return {
    eventos,
    execucoes,
    tempos,
    marcarEvento() {
      tempos.current.eventos.push(performance.now())
      setEventos((n) => n + 1)
    },
    marcarExecucao() {
      tempos.current.execucoes.push(performance.now())
      setExecucoes((n) => n + 1)
    },
  }
}

type Medicao = ReturnType<typeof useMedicao>

type Props = {
  medicao: Medicao
  posicao: number
  aoRolar: (evento: UIEvent<HTMLDivElement>) => void
}

// A mesma lista e os mesmos medidores nas duas versões: o que muda é quantas vezes o handler roda.
export function ListaRolavel({ medicao, posicao, aoRolar }: Props) {
  return (
    <Group align="flex-start" wrap="nowrap">
      <Box h={480} style={{ flex: 1, minWidth: 0, overflowY: 'auto' }} onScroll={aoRolar}>
        <Stack gap="xs">
          {ITENS.map((item) => (
            <Paper key={item} withBorder p="sm">
              {item}
            </Paper>
          ))}
        </Stack>
      </Box>

      {/* Medidores ao lado da lista: dá para rolar e olhar os números ao mesmo tempo. */}
      <Stack w={340} style={{ flexShrink: 0 }}>
        <Contador rotulo="Eventos de scroll" valor={medicao.eventos} />
        <Contador rotulo="Vezes que o handler rodou" valor={medicao.execucoes} />
        <Contador rotulo="Posição" valor={`${posicao}%`} />
        <LinhaDoTempo tempos={medicao.tempos} />
      </Stack>
    </Group>
  )
}

function Contador({ rotulo, valor }: { rotulo: string; valor: number | string }) {
  return (
    <Paper withBorder p="md">
      <Text size="sm" c="dimmed">
        {rotulo}
      </Text>
      <Text size="xl" fw={700}>
        {valor}
      </Text>
    </Paper>
  )
}

const JANELA = 3000
const ALTURA = 96
const MARGEM = 76

// Desenhada a cada quadro (requestAnimationFrame), no mesmo lugar onde roda o JavaScript:
// quando o handler trava a página, a bolinha dá trancos e o FPS despenca.
function LinhaDoTempo({ tempos }: { tempos: Medicao['tempos'] }) {
  const tela = useRef<HTMLCanvasElement>(null)
  const [fps, setFps] = useState(60)

  useEffect(() => {
    let quadro = 0
    let quadrosNoPeriodo = 0
    let inicioDoPeriodo = performance.now()

    const desenhar = (agora: number) => {
      quadrosNoPeriodo++
      if (agora - inicioDoPeriodo >= 500) {
        setFps(Math.round((quadrosNoPeriodo * 1000) / (agora - inicioDoPeriodo)))
        quadrosNoPeriodo = 0
        inicioDoPeriodo = agora
      }

      const canvas = tela.current
      const ctx = canvas?.getContext('2d')
      if (canvas && ctx) {
        const largura = canvas.clientWidth
        const escala = window.devicePixelRatio
        if (canvas.width !== largura * escala) {
          canvas.width = largura * escala
          canvas.height = ALTURA * escala
        }
        ctx.setTransform(escala, 0, 0, escala, 0, 0)
        ctx.clearRect(0, 0, largura, ALTURA)

        const util = largura - MARGEM - 8
        const x = (t: number) => MARGEM + util - ((agora - t) / JANELA) * util

        ctx.font = '12px system-ui, sans-serif'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#868e96'
        ctx.fillText('Eventos', 8, 18)
        ctx.fillText('Handler', 8, 46)
        ctx.fillText('Animação', 8, 76)

        // Esquece o que já saiu da janela de 3s.
        for (const lista of [tempos.current.eventos, tempos.current.execucoes]) {
          while (lista.length && agora - lista[0] > JANELA) lista.shift()
        }

        ctx.fillStyle = '#adb5bd'
        for (const t of tempos.current.eventos) ctx.fillRect(x(t), 8, 2, 20)
        ctx.fillStyle = '#228be6'
        for (const t of tempos.current.execucoes) ctx.fillRect(x(t) - 1, 36, 3, 20)

        // Bolinha indo e voltando a cada 2s: lisa a 60 FPS, aos trancos quando a página trava.
        ctx.strokeStyle = '#e9ecef'
        ctx.beginPath()
        ctx.moveTo(MARGEM, 76)
        ctx.lineTo(MARGEM + util, 76)
        ctx.stroke()
        const fase = (agora % 2000) / 2000
        const ida = fase < 0.5 ? fase * 2 : 2 - fase * 2
        ctx.fillStyle = '#7950f2'
        ctx.beginPath()
        ctx.arc(MARGEM + ida * util, 76, 8, 0, Math.PI * 2)
        ctx.fill()
      }

      quadro = requestAnimationFrame(desenhar)
    }

    quadro = requestAnimationFrame(desenhar)
    return () => cancelAnimationFrame(quadro)
  }, [tempos])

  const cor = fps >= 50 ? 'green' : fps >= 30 ? 'orange' : 'red'

  return (
    <Paper withBorder p="xs">
      <Group justify="space-between" mb={4} px={4}>
        <Text size="sm" c="dimmed">
          Últimos 3 segundos
        </Text>
        <Text size="lg" fw={700} c={cor}>
          {fps} FPS
        </Text>
      </Group>
      <canvas ref={tela} style={{ width: '100%', height: ALTURA, display: 'block' }} />
    </Paper>
  )
}
