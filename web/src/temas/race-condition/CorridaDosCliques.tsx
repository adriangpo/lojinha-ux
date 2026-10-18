import { Badge, Group, Paper, Stack, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useEventos, type Trecho } from '../../monitor/useEventos'

// Só para a aula: desenha a corrida entre as requisições a partir dos eventos do monitor.
// Uma barra por clique, de quando a requisição saiu até quando chegou, e qual resposta ficou na tela.
export function CorridaDosCliques({ escolhida }: { escolhida: string | null }) {
  // Só os eventos do navegador: a corrida não precisa da API (e assim não gasta uma conexão).
  const { trechos } = useEventos({ daApi: false })
  const [agora, setAgora] = useState(Date.now())

  const requisicoes = trechos.filter((trecho) => trecho.faixa === 'navegador' && trecho.rotulo.includes('/categoria-lenta'))

  // A corrida atual: as requisições desde o último momento em que nada estava no ar.
  let corrida: Trecho[] = []
  for (const requisicao of requisicoes) {
    const tudoChegou = corrida.every((outra) => outra.fim !== undefined && outra.fim < requisicao.inicio)
    corrida = tudoChegou ? [requisicao] : [...corrida, requisicao]
  }
  const pendentes = corrida.some((requisicao) => requisicao.fim === undefined)

  // Enquanto houver requisição no ar, redesenha para as barras crescerem.
  useEffect(() => {
    if (!pendentes) return
    const timer = setInterval(() => setAgora(Date.now()), 50)
    return () => clearInterval(timer)
  }, [pendentes])

  const inicio = corrida[0]?.inicio ?? agora
  const fim = Math.max(agora, ...corrida.map((requisicao) => requisicao.fim ?? 0))
  const total = Math.max(fim - inicio, 2500)

  // Ordem em que as respostas chegaram (as canceladas não contam).
  const chegadas = corrida
    .filter((requisicao) => requisicao.fim !== undefined && requisicao.resultado === 'ok')
    .sort((a, b) => a.fim! - b.fim!)
  const naTela = chegadas.at(-1)

  return (
    <Paper withBorder p="md">
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Corrida dos cliques</Text>
        <Text size="sm" c="dimmed">
          barra = do envio até a resposta
        </Text>
      </Group>
      {corrida.length === 0 && (
        <Text size="sm" c="dimmed">
          Clique em Eletrônicos e, logo depois, em Casa: cada clique vira uma requisição, e as barras mostram quem chega primeiro.
        </Text>
      )}
      <Stack gap={6}>
        {corrida.map((requisicao) => (
          <Linha
            key={requisicao.id}
            requisicao={requisicao}
            inicio={inicio}
            total={total}
            agora={agora}
            ordem={chegadas.indexOf(requisicao) + 1}
            naTela={requisicao === naTela}
            certa={categoriaDa(requisicao) === escolhida}
          />
        ))}
      </Stack>
    </Paper>
  )
}

function categoriaDa(requisicao: Trecho) {
  return new URLSearchParams(requisicao.rotulo.split('?')[1]).get('categoria') ?? ''
}

type Props = { requisicao: Trecho; inicio: number; total: number; agora: number; ordem: number; naTela: boolean; certa: boolean }

function Linha({ requisicao, inicio, total, agora, ordem, naTela, certa }: Props) {
  const cancelada = requisicao.resultado === 'cancelada'
  const pendente = requisicao.fim === undefined
  const esquerda = ((requisicao.inicio - inicio) / total) * 100
  const largura = Math.max((((requisicao.fim ?? agora) - requisicao.inicio) / total) * 100, 0.5)
  const cor = cancelada ? 'var(--mantine-color-gray-4)' : pendente ? 'var(--mantine-color-blue-5)' : 'var(--mantine-color-green-6)'

  return (
    <Group gap="sm" wrap="nowrap">
      <Text size="sm" w={100} style={{ flexShrink: 0, textDecoration: cancelada ? 'line-through' : undefined }} c={cancelada ? 'dimmed' : undefined}>
        {categoriaDa(requisicao)}
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
