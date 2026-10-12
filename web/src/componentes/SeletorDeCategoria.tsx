import { SegmentedControl } from '@mantine/core'
import { CATEGORIAS } from '../lib/produtos'

type Props = {
  valor: string
  aoMudar: (categoria: string) => void
}

export function SeletorDeCategoria({ valor, aoMudar }: Props) {
  return <SegmentedControl data={CATEGORIAS} value={valor} onChange={aoMudar} size="md" />
}
