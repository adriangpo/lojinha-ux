import { Button, Stack } from '@mantine/core'
import { useState } from 'react'
import { monitor } from '../../lib/monitor'
import { FormularioDePix } from './FormularioDePix'
import { TabelaDeTransferencias } from './TabelaDeTransferencias'
import { PIX_INICIAL, transferir } from './transferencias'

export function BotaoTravado() {
  const [atualizacao, setAtualizacao] = useState(0)
  const [pix, setPix] = useState(PIX_INICIAL)
  const [enviando, setEnviando] = useState(false)

  async function aoClicar() {
    monitor.marca('clicou em Transferir')
    setEnviando(true)
    monitor.tela('botão "Enviando…" travado')
    try {
      const transferencia = await transferir(pix)
      monitor.tela(`Pix #${transferencia.id} confirmado`)
      setAtualizacao((n) => n + 1)
    } finally {
      // Libera o botão mesmo se der erro, senão o usuário fica preso.
      setEnviando(false)
    }
  }

  // Resolve na tela, mas a API continua sem proteção:
  // um retry automático ou uma rede instável ainda podem enviar dois Pix.
  return (
    <Stack gap="xl">
      <FormularioDePix pix={pix} aoMudar={setPix}>
        <Button size="md" onClick={aoClicar} disabled={enviando}>
          {enviando ? 'Enviando…' : 'Transferir'}
        </Button>
      </FormularioDePix>
      <TabelaDeTransferencias atualizacao={atualizacao} />
    </Stack>
  )
}
