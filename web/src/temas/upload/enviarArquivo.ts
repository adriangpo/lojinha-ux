import { ErroDaApi } from '../../lib/api'
import { monitor } from '../../lib/monitor'

export type StatusDoUpload = {
  id: number
  progresso: number
  etapa: string
}

// Fase 1: o envio dos bytes. Quem sabe quanto já foi é o navegador.
// O fetch não avisa o progresso do upload; o XMLHttpRequest avisa (xhr.upload.onprogress).
export function enviarArquivo(arquivo: File, aoProgredir?: (porcentagem: number) => void) {
  return new Promise<{ id: number }>((resolver, rejeitar) => {
    const id = crypto.randomUUID()
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/uploads?nome=${encodeURIComponent(arquivo.name)}`)
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')
    // Igual ao lib/api.ts: liga a barra do navegador à barra da API no monitor.
    xhr.setRequestHeader('x-request-id', id)

    xhr.upload.onprogress = (evento) => {
      monitor.progresso(id, evento.loaded / evento.total)
      aoProgredir?.(Math.round((evento.loaded / evento.total) * 100))
    }

    xhr.onload = () => {
      monitor.fim(id, xhr.status < 400 ? 'ok' : 'erro', String(xhr.status))
      if (xhr.status < 400) resolver(JSON.parse(xhr.responseText))
      else rejeitar(new ErroDaApi(xhr.status, 'Não foi possível enviar o arquivo'))
    }
    xhr.onerror = () => {
      monitor.fim(id, 'erro')
      rejeitar(new Error('Falha de rede'))
    }

    monitor.inicio(id, 'POST /uploads')
    xhr.send(arquivo)
  })
}
