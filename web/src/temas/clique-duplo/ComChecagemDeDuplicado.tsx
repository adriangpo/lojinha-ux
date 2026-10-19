import { Alert, Button, Group, Stack, Text } from '@mantine/core'
import { useState } from 'react'
import { monitor } from '../../lib/monitor'
import { FormularioDePix } from './FormularioDePix'
import { TabelaDeTransferencias } from './TabelaDeTransferencias'
import { codeDoErro, PIX_INICIAL, transferirComChecagem } from './transferencias'

type Aviso = { cor: string; texto: string }

// A chave protege contra o retry (a mesma tentativa chegando duas vezes).
// Esta versão protege também contra o usuário: um Pix igual há menos de 15s fica bloqueado até a janela passar.
export function ComChecagemDeDuplicado() {
  const [atualizacao, setAtualizacao] = useState(0)
  const [pix, setPix] = useState(PIX_INICIAL)
  const [chave, setChave] = useState(() => crypto.randomUUID())
  const [aviso, setAviso] = useState<Aviso>()

  function mostrar(cor: string, texto: string) {
    setAviso({ cor, texto })
    monitor.tela(texto)
  }

  async function aoClicar() {
    monitor.marca('clicou em Transferir')
    try {
      const { id } = await transferirComChecagem(pix, chave)
      mostrar('green', `Pix #${id} confirmado`)
      setAtualizacao((n) => n + 1)
      setChave(crypto.randomUUID())
    } catch (erro) {
      const code = codeDoErro(erro)
      if (code === 'TRANSFER_DUPLICATE' && erro instanceof Error) {
        // A mensagem da API já diz há quanto tempo foi o outro e quanto falta (também no Retry-After).
        mostrar('orange', erro.message)
      } else if (code === 'IDEMPOTENCY_KEY_IN_PROGRESS') {
        mostrar('blue', 'Esse Pix ainda está sendo processado. Nenhum Pix novo foi enviado.')
      } else {
        mostrar('red', erro instanceof Error ? erro.message : 'Erro inesperado')
      }
    }
  }

  return (
    <Stack gap="xl">
      <FormularioDePix pix={pix} aoMudar={setPix}>
        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            Chave: {chave.slice(0, 8)}
          </Text>
          <Button size="md" onClick={aoClicar}>
            Transferir
          </Button>
        </Group>
        {aviso && <Alert color={aviso.cor}>{aviso.texto}</Alert>}
      </FormularioDePix>

      <TabelaDeTransferencias atualizacao={atualizacao} />
    </Stack>
  )
}
