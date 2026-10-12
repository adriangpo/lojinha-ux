import { Stack, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { monitor } from '../../lib/monitor'
import { BarraDaFase } from './BarraDaFase'
import { EscolherArquivo } from './EscolherArquivo'
import { enviarArquivo, type StatusDoUpload } from './enviarArquivo'

export function ComSse() {
  const [envio, setEnvio] = useState<number>()
  const [idDoUpload, setIdDoUpload] = useState<number>()
  const [status, setStatus] = useState<StatusDoUpload>()
  const [avisos, setAvisos] = useState(0)

  async function enviar(arquivo: File) {
    setIdDoUpload(undefined)
    setStatus(undefined)
    setAvisos(0)
    setEnvio(0)
    const { id } = await enviarArquivo(arquivo, setEnvio)
    setIdDoUpload(id)
    monitor.tela('envio 100%, processando…')
  }

  // Fase 2: uma conexão só, e o servidor avisa a cada mudança (Postgres NOTIFY → API → SSE).
  useEffect(() => {
    if (idDoUpload === undefined) return

    // Só para o monitor: o EventSource não passa pelo lib/api.ts.
    const idNoMonitor = crypto.randomUUID()
    monitor.inicio(idNoMonitor, `GET /uploads/${idDoUpload}/eventos (SSE)`)

    const fonte = new EventSource(`/api/uploads/${idDoUpload}/eventos`)
    fonte.onmessage = (mensagem) => {
      const atual: StatusDoUpload = JSON.parse(mensagem.data)
      monitor.aviso(`${atual.progresso}%`, 'api', 'navegador', idNoMonitor)
      setStatus(atual)
      setAvisos((n) => n + 1)
      // Terminou: fecha a conexão. Sem isso, o EventSource reconectaria sozinho.
      if (atual.progresso === 100) {
        fonte.close()
        monitor.fim(idNoMonitor, 'ok')
        monitor.tela('barra em 100%: pronto')
      }
    }

    return () => {
      if (fonte.readyState !== EventSource.CLOSED) {
        fonte.close()
        monitor.fim(idNoMonitor, 'cancelada')
      }
    }
  }, [idDoUpload])

  return (
    <Stack maw={640}>
      <EscolherArquivo aoEnviar={enviar} enviando={envio !== undefined && idDoUpload === undefined} />
      {envio !== undefined && <BarraDaFase titulo="1. Envio do arquivo" valor={envio} legenda={`${envio}%`} />}
      {idDoUpload !== undefined && (
        <>
          <BarraDaFase
            titulo="2. Processamento no servidor"
            valor={status?.progresso ?? 0}
            legenda={status ? `${status.etapa} · ${status.progresso}%` : 'Conectando…'}
          />
          <Text fw={600}>Avisos recebidos por uma única conexão: {avisos}</Text>
        </>
      )}
    </Stack>
  )
}
