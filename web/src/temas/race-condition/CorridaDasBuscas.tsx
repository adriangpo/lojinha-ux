import { Badge, Group, Paper, Stack, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useEventos, type Trecho } from '../../monitor/useEventos'

// Só para a aula: desenha a corrida entre as buscas a partir dos eventos do monitor.
// Uma barra por busca, de quando saiu até quando chegou, e qual resposta ficou na tela.
export function CorridaDasBuscas({ digitado }: { digitado: string }) {
  // Só os eventos do navegador: a corrida não precisa da API (e assim não gasta uma conexão).
  const { trechos, limpar } = useEventos({ daApi: false })
  const [agora, setAgora] = useState(Date.now())

  // Apagou o campo: começa uma corrida nova.
  useEffect(() => {
    if (digitado === '') limpar()
  }, [digitado])

  const buscas = trechos.filter((trecho) => trecho.faixa === 'navegador' && trecho.rotulo.includes('/busca-lenta') && termoDa(trecho) !== '')
  const pendentes = buscas.some((busca) => busca.fim === undefined)

  // Enquanto houver busca no ar, redesenha para as barras crescerem.
  useEffect(() => {
    if (!pendentes) return
    const timer = setInterval(() => setAgora(Date.now()), 50)
    return () => clearInterval(timer)
  }, [pendentes])

  const inicio = buscas[0]?.inicio ?? agora
  const fim = Math.max(agora, ...buscas.map((busca) => busca.fim ?? 0))
  const total = Math.max(fim - inicio, 2500)

  // Ordem em que as respostas chegaram (as canceladas não contam).
  const chegadas = buscas
    .filter((busca) => busca.fim !== undefined && busca.resultado === 'ok')
    .sort((a, b) => a.fim! - b.fim!)
  const naTela = chegadas.at(-1)

  return (
    <Paper withBorder p="md">
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Corrida das buscas</Text>
        <Text size="sm" c="dimmed">
          barra = do envio até a resposta
        </Text>
      </Group>
      {buscas.length === 0 && (
        <Text size="sm" c="dimmed">
          Digite uma palavra curta, como “fone”: cada letra vira uma busca, e as barras mostram quem chega primeiro.
        </Text>
      )}
      <Stack gap={6}>
        {buscas.map((busca) => (
          <Linha
            key={busca.id}
            busca={busca}
            inicio={inicio}
            total={total}
            agora={agora}
            ordem={chegadas.indexOf(busca) + 1}
            naTela={busca === naTela}
            certa={termoDa(busca) === digitado}
          />
        ))}
      </Stack>
    </Paper>
  )
}

function termoDa(busca: Trecho) {
  return new URLSearchParams(busca.rotulo.split('?')[1]).get('busca') ?? ''
}

type Props = { busca: Trecho; inicio: number; total: number; agora: number; ordem: number; naTela: boolean; certa: boolean }

function Linha({ busca, inicio, total, agora, ordem, naTela, certa }: Props) {
  const cancelada = busca.resultado === 'cancelada'
  const pendente = busca.fim === undefined
  const esquerda = ((busca.inicio - inicio) / total) * 100
  const largura = Math.max((((busca.fim ?? agora) - busca.inicio) / total) * 100, 0.5)
  const cor = cancelada ? 'var(--mantine-color-gray-4)' : pendente ? 'var(--mantine-color-blue-5)' : 'var(--mantine-color-green-6)'

  return (
    <Group gap="sm" wrap="nowrap">
      <Text ff="monospace" size="sm" w={80} style={{ flexShrink: 0, textDecoration: cancelada ? 'line-through' : undefined }} c={cancelada ? 'dimmed' : undefined}>
        “{termoDa(busca)}”
      </Text>
      <div style={{ position: 'relative', flex: 1, height: 18, background: 'var(--mantine-color-gray-0)', borderRadius: 4 }}>
        <div style={{ position: 'absolute', left: `${esquerda}%`, width: `${largura}%`, top: 2, bottom: 2, background: cor, borderRadius: 3 }} />
      </div>
      <div style={{ width: 170, flexShrink: 0 }}>
        {cancelada && (
          <Badge color="gray" variant="light">
            cancelada
          </Badge>
        )}
        {pendente && (
          <Badge color="blue" variant="light">
            no ar…
          </Badge>
        )}
        {!cancelada && !pendente && (
          <Group gap={4} wrap="nowrap">
            <Badge color="gray" variant="outline">
              chegou {ordem}ª
            </Badge>
            {naTela && (
              <Badge color={certa ? 'green' : 'red'} variant="filled">
                na tela
              </Badge>
            )}
          </Group>
        )}
      </div>
    </Group>
  )
}
