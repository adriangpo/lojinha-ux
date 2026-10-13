import { Badge, Group, SegmentedControl, Stack, Text, Title } from '@mantine/core'
import { Navigate, useParams, useSearchParams } from 'react-router'
import { TEMAS, type Etiqueta } from '../temas'
import { VerCodigo } from './VerCodigo'

const CORES: Record<Etiqueta, string> = {
  Frontend: 'blue',
  API: 'grape',
  'Frontend + API': 'teal',
}

export function PaginaDoTema() {
  const { slug } = useParams()
  const [parametros, setParametros] = useSearchParams()

  const tema = TEMAS.find((t) => t.slug === slug)
  if (!tema) return <Navigate to="/" replace />

  // A versão escolhida fica na URL: dá F5 e ela continua lá.
  const nomeDaVersao = parametros.get('versao') ?? tema.versoes[0]?.nome
  const versao = tema.versoes.find((v) => v.nome === nomeDaVersao) ?? tema.versoes[0]

  return (
    <Stack gap="lg" maw={960}>
      <Group justify="space-between">
        <Group>
          <Title order={2}>{tema.titulo}</Title>
          <Badge color={CORES[tema.etiqueta]} variant="light" size="lg">
            {tema.etiqueta}
          </Badge>
        </Group>

        <Group>
          {versao && <VerCodigo key={`codigo-${tema.slug}`} titulo={tema.titulo} versoes={tema.versoes} versaoDaPagina={versao.nome} />}
          {tema.versoes.length > 1 && (
            <SegmentedControl
              // Um seletor novo por tema: reaproveitado, o Mantine perde a marcação azul
              // quando o tema seguinte tem o mesmo número de versões.
              key={tema.slug}
              data={tema.versoes.map((v) => v.nome)}
              value={versao.nome}
              onChange={(nome) => setParametros({ versao: nome })}
            />
          )}
        </Group>
      </Group>

      {versao ? <versao.componente key={`${tema.slug}/${versao.nome}`} /> : <Text c="dimmed">Em construção.</Text>}
    </Stack>
  )
}
