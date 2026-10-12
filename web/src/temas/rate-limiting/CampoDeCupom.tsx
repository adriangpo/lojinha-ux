import { Button, Group, TextInput } from '@mantine/core'
import { useState } from 'react'
import { monitor } from '../../lib/monitor'

type Props = {
  aoAplicar: (codigo: string) => void
  desabilitado?: boolean
  textoDoBotao?: string
}

// Campo + botão "Aplicar". Para a demo: clique várias vezes seguidas para estourar o limite.
export function CampoDeCupom({ aoAplicar, desabilitado = false, textoDoBotao = 'Aplicar' }: Props) {
  const [codigo, setCodigo] = useState('BEMVINDO10')

  return (
    <Group align="end">
      <TextInput label="Cupom de desconto" value={codigo} onChange={(e) => setCodigo(e.currentTarget.value)} />
      <Button
        disabled={desabilitado}
        onClick={() => {
          monitor.marca('clicou em Aplicar')
          aoAplicar(codigo)
        }}
      >
        {textoDoBotao}
      </Button>
    </Group>
  )
}
