import { Button, Stack } from '@mantine/core'
import { useState } from 'react'
import { monitor } from '../../lib/monitor'
import { FormularioDePix } from './FormularioDePix'
import { TabelaDeTransferencias } from './TabelaDeTransferencias'
import { PIX_INICIAL, transferir } from './transferencias'

export function SemProtecao() {
  const [atualizacao, setAtualizacao] = useState(0)
  const [pix, setPix] = useState(PIX_INICIAL)

  // O botão continua ativo durante o envio (1s sem resposta):
  // cada clique impaciente vira mais uma request, e cada request vira mais um Pix.
  async function aoClicar() {
    monitor.marca('clicou em Transferir')
    const transferencia = await transferir(pix)
    monitor.tela(`Pix #${transferencia.id} confirmado`)
    setAtualizacao((n) => n + 1)
  }

  return (
    <Stack gap="xl">
      <FormularioDePix pix={pix} aoMudar={setPix}>
        <Button size="md" onClick={aoClicar}>
          Transferir
        </Button>
      </FormularioDePix>
      <TabelaDeTransferencias atualizacao={atualizacao} />
    </Stack>
  )
}
