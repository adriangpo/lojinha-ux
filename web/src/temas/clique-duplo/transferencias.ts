import { api, ErroDaApi } from '../../lib/api'

export type Pix = { para: string; valorCentavos: number }

export type Transferencia = {
  id: number
  para: string
  valorCentavos: number
  chave: string | null
  criadoEm: string
}

export const PIX_INICIAL: Pix = { para: 'Maria Silva', valorCentavos: 5000 }

// A chave é opcional: só as versões com chave de idempotência mandam.
export function transferir(pix: Pix, chave?: string) {
  return api<{ id: number }>('/transferencias', {
    method: 'POST',
    corpo: pix,
    headers: chave ? { 'Idempotency-Key': chave } : undefined,
  })
}

// Versão "Pix duplicado": a API também bloqueia por um tempo um Pix igual a um recente.
export function transferirComChecagem(pix: Pix, chave: string) {
  return api<{ id: number }>('/transferencias-com-checagem', {
    method: 'POST',
    corpo: pix,
    headers: { 'Idempotency-Key': chave },
  })
}

// O code do primeiro erro ({ errors: [{ code, ... }] }), para o front decidir o que mostrar.
export function codeDoErro(erro: unknown) {
  return erro instanceof ErroDaApi ? erro.erros?.[0]?.code : undefined
}

export function listarTransferencias() {
  return api<Transferencia[]>('/transferencias')
}

export function limparTransferencias() {
  return api('/transferencias', { method: 'DELETE' })
}
