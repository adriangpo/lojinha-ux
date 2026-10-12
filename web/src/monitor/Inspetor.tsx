import { Badge, Code, Drawer, Group, Stack, Table, Text, Title } from '@mantine/core'
import type { Detalhes } from '../lib/monitor'
import { aparenciaDoTrecho } from './aparencia'
import type { Trecho } from './useEventos'

// Cabeçalhos que contam a história das demos; os outros ficam escondidos.
const IMPORTANTES = [
  'cache-control',
  'etag',
  'if-none-match',
  'retry-after',
  'idempotency-key',
  'idempotent-replayed',
  'ratelimit-limit',
  'ratelimit-remaining',
  'ratelimit-reset',
  'set-cookie',
  'cookie',
  'content-type',
  'content-length',
  'location',
]

type Props = {
  trecho?: Trecho
  trechos: Trecho[]
  aoFechar: () => void
  aoSelecionar: (trecho: Trecho) => void
}

// Painel lateral: tudo o que se sabe de uma barra, mais quem ela chamou e quem a chamou.
export function Inspetor({ trecho, trechos, aoFechar, aoSelecionar }: Props) {
  if (!trecho) return null

  const pai = trechos.find((outro) => outro.id === trecho.pai)
  const filhos = trechos.filter((outro) => outro.pai === trecho.id)
  const duracao = trecho.fim !== undefined && !trecho.instantaneo ? `${trecho.fim - trecho.inicio}ms` : undefined
  const origem = trecho.resposta?.origem

  return (
    <Drawer opened onClose={aoFechar} position="right" size="lg" title={<Title order={4}>{trecho.rotulo}</Title>}>
      <Stack>
        <Group gap="xs">
          <Badge variant="light">{trecho.faixa}</Badge>
          {trecho.detalhe && (
            <Badge style={{ background: aparenciaDoTrecho(trecho).fundo, color: aparenciaDoTrecho(trecho).texto }}>
              {trecho.detalhe}
            </Badge>
          )}
          {duracao && <Badge variant="outline">{duracao}</Badge>}
          {origem === 'cache' && <Badge color="teal">Cache do navegador: não foi à rede</Badge>}
          {origem === '304' && <Badge color="teal">304: perguntou e não tinha mudado</Badge>}
          {trecho.resposta?.bytes !== undefined && <Badge variant="outline">{trecho.resposta.bytes} bytes pela rede</Badge>}
        </Group>

        {trecho.requisicao && <SecaoDeDetalhes titulo="Pedido" detalhes={trecho.requisicao} />}
        {trecho.resposta && <SecaoDeDetalhes titulo="Resposta" detalhes={trecho.resposta} />}

        {pai && <Ligacoes titulo="Chamado por" trechos={[pai]} aoSelecionar={aoSelecionar} />}
        {filhos.length > 0 && <Ligacoes titulo="Chamou" trechos={filhos} aoSelecionar={aoSelecionar} />}
      </Stack>
    </Drawer>
  )
}

function SecaoDeDetalhes({ titulo, detalhes }: { titulo: string; detalhes: Detalhes }) {
  const cabecalhos = Object.entries(detalhes.cabecalhos ?? {}).filter(([nome]) => IMPORTANTES.includes(nome.toLowerCase()))

  return (
    <Stack gap={6}>
      <Text fw={700}>{titulo}</Text>
      {cabecalhos.length > 0 && (
        <Table withTableBorder fz="sm">
          <Table.Tbody>
            {cabecalhos.map(([nome, valor]) => (
              <Table.Tr key={nome}>
                <Table.Td fw={600} w={160}>
                  {nome}
                </Table.Td>
                <Table.Td style={{ wordBreak: 'break-all' }}>{valor}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
      {detalhes.corpo && <Code block>{formatar(detalhes.corpo)}</Code>}
    </Stack>
  )
}

function Ligacoes({ titulo, trechos, aoSelecionar }: { titulo: string; trechos: Trecho[]; aoSelecionar: (trecho: Trecho) => void }) {
  return (
    <Stack gap={4}>
      <Text fw={700}>{titulo}</Text>
      {trechos.map((trecho) => (
        <Text key={trecho.id} size="sm" c="blue" style={{ cursor: 'pointer' }} onClick={() => aoSelecionar(trecho)}>
          [{trecho.faixa}] {trecho.rotulo} {trecho.detalhe && `· ${trecho.detalhe}`}
        </Text>
      ))}
    </Stack>
  )
}

// JSON fica indentado; o resto (SQL, texto) aparece como veio.
function formatar(corpo: string) {
  try {
    return JSON.stringify(JSON.parse(corpo), null, 2)
  } catch {
    return corpo
  }
}
