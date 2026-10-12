import { Box, Group, Paper, Stack, Text } from '@mantine/core'
import { useState, type UIEvent } from 'react'
import { useThrottle } from '../../hooks/useThrottle'
import { monitor } from '../../lib/monitor'

const ITENS = Array.from({ length: 100 }, (_, i) => `Item ${i + 1}`)

export function ScrollComThrottle() {
  const [eventos, setEventos] = useState(0)
  const [execucoes, setExecucoes] = useState(0)
  const [posicao, setPosicao] = useState(0)

  // O trabalho "caro" do scroll (aqui: calcular a posição e avisar o monitor)
  // roda no máximo a cada 200ms, por mais eventos que cheguem.
  const atualizarPosicao = useThrottle((porcentagem: number) => {
    setExecucoes((n) => n + 1)
    setPosicao(porcentagem)
    monitor.tela(`handler rodou: posição ${porcentagem}%`)
  }, 200)

  function aoRolar(evento: UIEvent<HTMLDivElement>) {
    // O navegador dispara dezenas de eventos de scroll por segundo.
    setEventos((n) => n + 1)

    const { scrollTop, scrollHeight, clientHeight } = evento.currentTarget
    atualizarPosicao(Math.round((scrollTop / (scrollHeight - clientHeight)) * 100))
  }

  return (
    <Stack>
      <Group grow>
        <Contador rotulo="Eventos de scroll" valor={eventos} />
        <Contador rotulo="Vezes que o handler rodou" valor={execucoes} />
        <Contador rotulo="Posição" valor={`${posicao}%`} />
      </Group>

      <Box h={400} style={{ overflowY: 'auto' }} onScroll={aoRolar}>
        <Stack gap="xs">
          {ITENS.map((item) => (
            <Paper key={item} withBorder p="sm">
              {item}
            </Paper>
          ))}
        </Stack>
      </Box>
    </Stack>
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
