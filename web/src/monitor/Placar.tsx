import { Group, Paper, Text } from '@mantine/core'
import type { Trecho } from './useEventos'

// Números grandes para comparar versões: "15 requisições" contra "1" fala mais que as barras.
export function Placar({ trechos }: { trechos: Trecho[] }) {
  const requisicoes = trechos.filter((trecho) => trecho.faixa === 'navegador' && !trecho.instantaneo && trecho.estilo !== 'espera')
  const daRede = requisicoes.filter((trecho) => trecho.estilo !== 'cache')
  const doCache = requisicoes.length - daRede.length + trechos.filter((t) => t.instantaneo && t.estilo === 'cache').length
  const naApi = trechos.filter((trecho) => trecho.faixa === 'api')
  const noBanco = trechos.filter((trecho) => trecho.faixa === 'banco')
  const status = (trecho: Trecho) => Number(trecho.detalhe)
  const erros4xx = naApi.filter((trecho) => status(trecho) >= 400 && status(trecho) < 500).length
  const erros5xx = naApi.filter((trecho) => status(trecho) >= 500).length
  const bytes = requisicoes.reduce((total, trecho) => total + (trecho.resposta?.bytes ?? 0), 0)

  const numeros = [
    { nome: 'Requisições do navegador', valor: daRede.length },
    { nome: 'Do cache', valor: doCache },
    { nome: 'Chegaram na API', valor: naApi.length },
    { nome: 'Consultas ao banco', valor: noBanco.length },
    { nome: 'Erros 4xx', valor: erros4xx },
    { nome: 'Erros 5xx', valor: erros5xx },
    { nome: 'Baixado', valor: bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB` },
  ]

  return (
    <Group gap="sm" grow>
      {numeros.map(({ nome, valor }) => (
        <Paper key={nome} withBorder p="xs">
          <Text size="xs" c="dimmed">
            {nome}
          </Text>
          <Text size="xl" fw={700}>
            {valor}
          </Text>
        </Paper>
      ))}
    </Group>
  )
}
