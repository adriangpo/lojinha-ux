import { Button, FileInput, Group } from '@mantine/core'
import { useState } from 'react'
import { monitor } from '../../lib/monitor'

type Props = {
  aoEnviar: (arquivo: File) => void
  enviando: boolean
}

// Em localhost o envio é instantâneo; com um arquivo de uns 10 MB a fase 1 dura alguns segundos
// (a API lê o corpo devagar de propósito).
export function EscolherArquivo({ aoEnviar, enviando }: Props) {
  const [arquivo, setArquivo] = useState<File | null>(null)

  return (
    <Group align="end">
      <FileInput label="Arquivo" placeholder="Escolha um arquivo (uns 10 MB)" value={arquivo} onChange={setArquivo} w={320} />
      <Button
        disabled={!arquivo}
        loading={enviando}
        onClick={() => {
          monitor.marca('clicou em Enviar')
          if (arquivo) aoEnviar(arquivo)
        }}
      >
        Enviar
      </Button>
    </Group>
  )
}
