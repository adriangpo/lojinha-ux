import { TextInput } from '@mantine/core'
import { monitor } from '../lib/monitor'

type Props = {
  valor: string
  aoMudar: (valor: string) => void
}

// Campo de busca que também marca cada tecla no monitor.
export function CampoDeBusca({ valor, aoMudar }: Props) {
  return (
    <TextInput
      label="Buscar produto"
      placeholder="Ex.: teclado"
      size="md"
      value={valor}
      onChange={(evento) => {
        monitor.marca(`digitou “${evento.currentTarget.value}”`)
        aoMudar(evento.currentTarget.value)
      }}
    />
  )
}
