import { Alert, Stack, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { BarraDaFase } from './BarraDaFase'
import { EscolherArquivo } from './EscolherArquivo'
import { enviarArquivo, type StatusDoUpload } from './enviarArquivo'

export function ComLongPolling() {
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

  // Fase 2: pergunta "o que mudou depois de X%?" e a API só responde quando houver novidade.
  // Chegou a resposta, pergunta de novo na hora: sempre tem uma pergunta esperando no servidor.
  useEffect(() => {
    if (idDoUpload === undefined) return
    const controle = new AbortController()

    async function acompanhar() {
      let progresso = -1
      while (progresso < 100 && !controle.signal.aborted) {
        setPerguntas((n) => n + 1)
        try {
          const atual = await api<StatusDoUpload>(`/uploads/${idDoUpload}/novidades?depoisDe=${progresso}`, {
            signal: controle.signal,
          })
          progresso = atual.progresso
          setStatus(atual)
          monitor.tela(`barra em ${atual.progresso}%`)
        } catch {
          // Saiu da tela: para. Falhou: espera um pouco para não martelar a API.
          if (controle.signal.aborted) return
          await monitor.esperar('espera antes de perguntar de novo', 2000)
        }
      }
    }
    acompanhar()

    // Saiu da tela: cancela a pergunta que está esperando no servidor.
    return () => controle.abort()
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
