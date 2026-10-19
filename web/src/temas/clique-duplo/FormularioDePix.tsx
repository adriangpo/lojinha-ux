import { Card, NumberInput, Stack, TextInput } from '@mantine/core'
import type { ReactNode } from 'react'
import type { Pix } from './transferencias'

type Props = {
  pix: Pix
  aoMudar: (pix: Pix) => void
  children: ReactNode
}

// O Pix a enviar; cada versão coloca o seu botão "Transferir" embaixo.
export function FormularioDePix({ pix, aoMudar, children }: Props) {
  return (
    <Card withBorder padding="lg" maw={420}>
      <Stack>
        <TextInput label="Para" value={pix.para} onChange={(e) => aoMudar({ ...pix, para: e.currentTarget.value })} />
        <NumberInput
          label="Valor"
          prefix="R$ "
          decimalSeparator=","
          thousandSeparator="."
          decimalScale={2}
          fixedDecimalScale
          min={0}
          value={pix.valorCentavos / 100}
          onChange={(valor) => aoMudar({ ...pix, valorCentavos: Math.round(Number(valor) * 100) })}
        />
        {children}
      </Stack>
    </Card>
  )
}
