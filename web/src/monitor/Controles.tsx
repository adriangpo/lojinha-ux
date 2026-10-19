import { Button, Group, SegmentedControl, Stack, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useOfflineSimulado } from '../hooks/useOfflineSimulado'

type Controle = {
  latencia: number | 'aleatoria'
  taxaDeErro: number
}

const LATENCIAS = [
  { label: 'Nenhuma', value: '0' },
  { label: '300ms', value: '300' },
  { label: '1s', value: '1000' },
  { label: '3s', value: '3000' },
  { label: 'Aleatória', value: 'aleatoria' },
  // Tema Timeouts: uma API que parece travada.
  { label: 'Travada (30s)', value: '30000' },
]

const TAXAS_DE_ERRO = [
  { label: '0%', value: '0' },
  { label: '25%', value: '25' },
  { label: '50%', value: '50' },
  { label: '100%', value: '100' },
]

// Painel do apresentador. Usa fetch direto (sem passar pelo monitor) para não aparecer nas barras.
export function Controles() {
  const [controle, setControle] = useState<Controle>()
  const [sessaoExpirada, setSessaoExpirada] = useState(false)
  // Tema Offline: diferente dos outros, vale para as abas da lojinha, não para a API.
  const [offline, simularOffline] = useOfflineSimulado()

  // Relê a cada 2s: se a API reiniciar (os controles voltam a zero) ou alguém clicar em "Zerar"
  // na lojinha, o painel mostra o que vale de verdade, e não o que foi escolhido antes.
  useEffect(() => {
    const ler = () =>
      fetch('/api/controle')
        .then((resposta) => resposta.json())
        .then(setControle)
        .catch(() => undefined)
    ler()
    const timer = setInterval(ler, 2000)
    return () => clearInterval(timer)
  }, [])

  async function alterar(mudanca: Partial<Controle>) {
    const resposta = await fetch('/api/controle', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mudanca),
    })
    setControle(await resposta.json())
  }

  // Tema Sessão expirada: derruba todas as sessões, como se o token tivesse vencido.
  async function expirarSessao() {
    await fetch('/api/controle/expirar-sessoes', { method: 'POST' })
    setSessaoExpirada(true)
    setTimeout(() => setSessaoExpirada(false), 2000)
  }

  if (!controle) return null

  return (
    <Group gap="xl">
      <Stack gap={4}>
        <Text size="sm" fw={600}>
          Latência da API
        </Text>
        <SegmentedControl
          data={LATENCIAS}
          value={String(controle.latencia)}
          onChange={(valor) => alterar({ latencia: valor === 'aleatoria' ? valor : Number(valor) })}
        />
      </Stack>
      <Stack gap={4}>
        <Text size="sm" fw={600}>
          Taxa de erro
        </Text>
        <SegmentedControl
          data={TAXAS_DE_ERRO}
          value={String(controle.taxaDeErro)}
          onChange={(valor) => alterar({ taxaDeErro: Number(valor) })}
        />
      </Stack>
      <Stack gap={4}>
        <Text size="sm" fw={600}>
          Sessão
        </Text>
        <Button variant="light" color="red" onClick={expirarSessao}>
          {sessaoExpirada ? 'Sessão expirada ✓' : 'Expirar sessão agora'}
        </Button>
      </Stack>
      <Stack gap={4}>
        <Text size="sm" fw={600}>
          Conexão da lojinha
        </Text>
        <SegmentedControl
          data={[
            { label: 'Online', value: 'online' },
            { label: 'Offline', value: 'offline' },
          ]}
          color={offline ? 'yellow' : 'blue'}
          value={offline ? 'offline' : 'online'}
          onChange={(valor) => simularOffline(valor === 'offline')}
        />
      </Stack>
    </Group>
  )
}
