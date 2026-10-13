import { Alert, Stack, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { BarraDaFase } from './BarraDaFase'
import { EscolherArquivo } from './EscolherArquivo'
import { enviarArquivo, type StatusDoUpload } from './enviarArquivo'

export function ComPolling() {
  const [envio, setEnvio] = useState<number>()
  const [idDoUpload, setIdDoUpload] = useState<number>()
  const [status, setStatus] = useState<StatusDoUpload>()
  const [erro, setErro] = useState<string>()
  const [perguntas, setPerguntas] = useState(0)

  async function enviar(arquivo: File) {
    setIdDoUpload(undefined)
    setStatus(undefined)
    setPerguntas(0)
    setErro(undefined)
    setEnvio(0)
    try {
      const { id } = await enviarArquivo(arquivo, setEnvio)
      setIdDoUpload(id)
      monitor.tela('envio 100%, processando…')
    } catch (falha) {
      // Falhou no meio: diz o que houve e libera o botão para tentar de novo.
      setEnvio(undefined)
      setErro(falha instanceof Error ? falha.message : 'Não foi possível enviar o arquivo')
      monitor.tela('aviso de erro no envio')
    }
  }

  // Fase 2: pergunta à API a cada 2 segundos, mesmo quando nada mudou.
  // A novidade pode esperar até 2s para aparecer, e a maioria das respostas é repetida.
  useEffect(() => {
    if (idDoUpload === undefined) return

    const intervalo = setInterval(async () => {
      setPerguntas((n) => n + 1)
      try {
        const atual = await api<StatusDoUpload>(`/uploads/${idDoUpload}`)
        setStatus(atual)
        monitor.tela(`barra em ${atual.progresso}%`)
        if (atual.progresso === 100) clearInterval(intervalo)
      } catch {
        // Uma pergunta falhou: a próxima, daqui a 2s, tenta de novo.
      }
    }, 2000)

    return () => clearInterval(intervalo)
  }, [idDoUpload])

  return (
    <Stack maw={640}>
      <EscolherArquivo aoEnviar={enviar} enviando={envio !== undefined && idDoUpload === undefined} />
      {erro && <Alert color="red">{erro}. Tente de novo.</Alert>}
      {envio !== undefined && <BarraDaFase titulo="1. Envio do arquivo" valor={envio} legenda={`${envio}%`} />}
      {idDoUpload !== undefined && (
        <>
          <BarraDaFase
            titulo="2. Processamento no servidor"
            valor={status?.progresso ?? 0}
            legenda={status ? `${status.etapa} · ${status.progresso}%` : 'Aguardando…'}
          />
          <Text fw={600}>Perguntas feitas à API: {perguntas}</Text>
        </>
      )}
    </Stack>
  )
}
