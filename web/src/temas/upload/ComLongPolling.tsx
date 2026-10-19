import { Alert, Stack } from '@mantine/core'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { BarraDaFase } from './BarraDaFase'
import { EscolherArquivo } from './EscolherArquivo'
import { enviarArquivo, type StatusDoUpload } from './enviarArquivo'
import { LinhaDasPerguntas, usePerguntas } from './LinhaDasPerguntas'

export function ComLongPolling() {
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

  // Fase 2: uma pergunta só, "me avisa quando terminar?", e a API segura a resposta até lá.
  // A conexão fica aberta o processamento inteiro. Se passar dos 30s sem terminar, a API responde
  // como está e o front pergunta de novo: é isso que faz ser long *polling*.
  useEffect(() => {
    if (idDoUpload === undefined) return
    const controle = new AbortController()

    async function esperarTerminar() {
      while (!controle.signal.aborted) {
        const responder = perguntar()
        try {
          const atual = await api<StatusDoUpload>(`/uploads/${idDoUpload}/resultado`, { signal: controle.signal })
          // Só não é novidade quando o prazo de 30s venceu antes de terminar.
          responder({ progresso: atual.progresso, novidade: atual.progresso === 100 })
          setStatus(atual)
          if (atual.progresso === 100) {
            monitor.tela('barra em 100%: pronto')
            return
          }
        } catch {
          // Saiu da tela: para. Falhou: espera um pouco para não martelar a API.
          if (controle.signal.aborted) return
          responder({ erro: true })
          await monitor.esperar('espera antes de perguntar de novo', 2000)
        }
      }
    }
    esperarTerminar()

    // Saiu da tela: cancela a pergunta que está esperando no servidor.
    return () => controle.abort()
  }, [idDoUpload])

  const pronto = status?.progresso === 100

  return (
    <Stack maw={640}>
      <EscolherArquivo aoEnviar={enviar} enviando={envio !== undefined && idDoUpload === undefined} />
      {erro && <Alert color="red">{erro}. Tente de novo.</Alert>}
      {envio !== undefined && <BarraDaFase titulo="1. Envio do arquivo" valor={envio} legenda={`${envio}%`} />}
      {idDoUpload !== undefined && (
        <>
          {/* A resposta só diz "terminou": no meio do caminho, não há porcentagem para mostrar. */}
          <BarraDaFase
            titulo="2. Processamento no servidor"
            valor={pronto ? 100 : 0}
            indeterminada={!pronto}
            legenda={pronto ? `${status.etapa} · 100%` : 'Esperando o servidor avisar que terminou…'}
          />
          <LinhaDasPerguntas perguntas={perguntas} inicio={inicio} />
        </>
      )}
    </Stack>
  )
}
