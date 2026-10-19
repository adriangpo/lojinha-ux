import { Alert, Stack } from '@mantine/core'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { BarraDaFase } from './BarraDaFase'
import { EscolherArquivo } from './EscolherArquivo'
import { enviarArquivo, type StatusDoUpload } from './enviarArquivo'
import { LinhaDasPerguntas, usePerguntas } from './LinhaDasPerguntas'

export function ComPolling() {
  const [envio, setEnvio] = useState<number>()
  const [idDoUpload, setIdDoUpload] = useState<number>()
  const [status, setStatus] = useState<StatusDoUpload>()
  const [erro, setErro] = useState<string>()
  const { perguntas, inicio, recomecar, perguntar } = usePerguntas()

  async function enviar(arquivo: File) {
    setIdDoUpload(undefined)
    setStatus(undefined)
    setErro(undefined)
    setEnvio(0)
    try {
      const { id } = await enviarArquivo(arquivo, setEnvio)
      recomecar()
      setIdDoUpload(id)
      monitor.tela('envio 100%, processando…')
    } catch (falha) {
      // Falhou no meio: diz o que houve e libera o botão para tentar de novo.
      setEnvio(undefined)
      setErro(falha instanceof Error ? falha.message : 'Não foi possível enviar o arquivo')
      monitor.tela('aviso de erro no envio')
    }
  }

  // Fase 2: pergunta à API a cada 2 segundos, mude algo ou não.
  // Na pausa do servidor, a resposta vem repetida; na rajada, a barra pula etapas e a novidade chega até 2s atrasada.
  useEffect(() => {
    if (idDoUpload === undefined) return
    let ultimo = -1

    const intervalo = setInterval(async () => {
      const responder = perguntar()
      try {
        const atual = await api<StatusDoUpload>(`/uploads/${idDoUpload}`)
        responder({ progresso: atual.progresso, novidade: atual.progresso !== ultimo })
        ultimo = atual.progresso
        setStatus(atual)
        monitor.tela(`barra em ${atual.progresso}%`)
        if (atual.progresso === 100) clearInterval(intervalo)
      } catch {
        // Uma pergunta falhou: a próxima, daqui a 2s, tenta de novo.
        responder({ erro: true })
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
          <LinhaDasPerguntas perguntas={perguntas} inicio={inicio} />
        </>
      )}
    </Stack>
  )
}
