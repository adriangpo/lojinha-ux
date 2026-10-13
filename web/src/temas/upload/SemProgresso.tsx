import { Alert, Group, Loader, Stack, Text } from '@mantine/core'
import { useState } from 'react'
import { monitor } from '../../lib/monitor'
import { EscolherArquivo } from './EscolherArquivo'
import { enviarArquivo } from './enviarArquivo'

// Quanto falta? Travou? Já dá para usar a imagem?
// O usuário não sabe nada: nem do envio, nem do processamento que continua no servidor.
export function SemProgresso() {
  const [estado, setEstado] = useState<'parado' | 'enviando' | 'enviado' | 'erro'>('parado')

  async function enviar(arquivo: File) {
    setEstado('enviando')
    monitor.tela('spinner, sem saber quanto falta')
    try {
      await enviarArquivo(arquivo)
      setEstado('enviado')
      monitor.tela('"estamos processando" — até quando?')
    } catch {
      setEstado('erro')
      monitor.tela('“Erro no envio”')
    }
  }

  return (
    <Stack>
      <EscolherArquivo aoEnviar={enviar} enviando={estado === 'enviando'} />
      {estado === 'enviando' && (
        <Group>
          <Loader size="sm" />
          <Text>Enviando…</Text>
        </Group>
      )}
      {estado === 'enviado' && <Alert color="gray">Arquivo recebido. Estamos processando.</Alert>}
      {estado === 'erro' && <Alert color="red">Erro no envio.</Alert>}
    </Stack>
  )
}
