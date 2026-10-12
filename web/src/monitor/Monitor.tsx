import {
  ActionIcon,
  Box,
  Button,
  Container,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useState } from 'react'
import { LEGENDA } from './aparencia'
import { Barras } from './Barras'
import { Controles } from './Controles'
import { Inspetor } from './Inspetor'
import { organizar } from './organizar'
import { Placar } from './Placar'
import { Sequencia } from './Sequencia'
import { useEventos, type Trecho } from './useEventos'

const JANELAS = [
  { label: '5s', value: '5000' },
  { label: '10s', value: '10000' },
  { label: '30s', value: '30000' },
]

// Uma linha do tempo guardada para comparar: roda a versão ruim, fixa, roda a boa.
type Fixado = { id: number; nome: string; trechos: Trecho[] }

export function Monitor() {
  const { trechos, limpar } = useEventos()
  const [visao, setVisao] = useState('Barras')
  const [janela, setJanela] = useState('10000')
  const [agrupar, setAgrupar] = useState(false)
  const [esconder, setEsconder] = useState('')
  const [fixados, setFixados] = useState<Fixado[]>([])
  // Qual barra está aberta no inspetor, e se ela é de uma linha fixada.
  const [inspecionado, setInspecionado] = useState<{ trecho: Trecho; fixado?: number }>()
  const contexto = fixados.find((fixado) => fixado.id === inspecionado?.fixado)?.trechos ?? trechos
  // Busca a versão atual da barra: ela pode ter terminado depois do clique.
  const trechoInspecionado = inspecionado && (contexto.find((t) => t.id === inspecionado.trecho.id) ?? inspecionado.trecho)

  const organizados = (lista: Trecho[]) => organizar(lista, { esconder, agrupar })

  function fixar() {
    if (trechos.length === 0) return
    setFixados((atuais) => [...atuais, { id: Date.now(), nome: `Versão ${atuais.length + 1}`, trechos }])
    limpar()
  }

  function renomear(id: number, nome: string) {
    setFixados((atuais) => atuais.map((fixado) => (fixado.id === id ? { ...fixado, nome } : fixado)))
  }

  return (
    <Container fluid p="lg">
      <Stack>
        <Group justify="space-between">
          <Title order={2}>Monitor</Title>
          <Group>
            <SegmentedControl data={['Barras', 'Sequência']} value={visao} onChange={setVisao} />
            {visao === 'Barras' && <SegmentedControl data={JANELAS} value={janela} onChange={setJanela} />}
            <Switch label="Agrupar iguais" checked={agrupar} onChange={(evento) => setAgrupar(evento.currentTarget.checked)} />
            <TextInput placeholder="Esconder (ex.: imagens)" value={esconder} onChange={(evento) => setEsconder(evento.currentTarget.value)} w={200} />
            <Button variant="light" onClick={fixar} disabled={trechos.length === 0}>
              Fixar para comparar
            </Button>
            <Button variant="default" onClick={limpar}>
              Limpar
            </Button>
          </Group>
        </Group>

        <Paper withBorder p="md">
          <Group justify="space-between" align="end">
            <Controles />
            <Group gap="md">
              {LEGENDA.map(({ nome, aparencia }) => (
                <Group key={nome} gap={6}>
                  <Box w={14} h={14} style={{ borderRadius: 3, background: aparencia.fundo, border: aparencia.borda }} />
                  <Text size="sm">{nome}</Text>
                </Group>
              ))}
            </Group>
          </Group>
        </Paper>

        {fixados.map((fixado) => (
          <Paper key={fixado.id} withBorder p="sm" bg="gray.0">
            <Stack gap="xs">
              <Group justify="space-between">
                <TextInput
                  variant="unstyled"
                  fw={700}
                  size="md"
                  value={fixado.nome}
                  onChange={(evento) => renomear(fixado.id, evento.currentTarget.value)}
                />
                <ActionIcon variant="subtle" color="gray" onClick={() => setFixados((atuais) => atuais.filter((f) => f.id !== fixado.id))}>
                  ✕
                </ActionIcon>
              </Group>
              <Placar trechos={fixado.trechos} />
              <Barras
                trechos={organizados(fixado.trechos)}
                janela={Number(janela)}
                selecionado={inspecionado?.trecho.id}
                aoSelecionar={(trecho) => setInspecionado({ trecho, fixado: fixado.id })}
              />
            </Stack>
          </Paper>
        ))}

        {fixados.length > 0 && <Text fw={700}>Agora</Text>}
        <Placar trechos={trechos} />

        {visao === 'Barras' ? (
          <Barras
            trechos={organizados(trechos)}
            janela={Number(janela)}
            selecionado={inspecionado?.trecho.id}
            aoSelecionar={(trecho) => setInspecionado({ trecho })}
          />
        ) : (
          <Sequencia trechos={organizados(trechos)} />
        )}
      </Stack>

      <Inspetor
        trecho={trechoInspecionado}
        trechos={contexto}
        aoFechar={() => setInspecionado(undefined)}
        aoSelecionar={(trecho) => setInspecionado((atual) => atual && { ...atual, trecho })}
      />
    </Container>
  )
}
