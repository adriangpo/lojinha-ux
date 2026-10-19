import { Alert, Button, Group, Stack, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { monitor } from '../../lib/monitor'
import { FormularioDePix } from './FormularioDePix'
import { TabelaDeTransferencias } from './TabelaDeTransferencias'
import { codeDoErro, PIX_INICIAL, transferir, type Pix } from './transferencias'

// Mesmo valor da API (VALIDADE_DA_CHAVE), só para mostrar a contagem na tela.
const VALIDADE_DA_CHAVE_MS = 30_000

type Envio = { pix: Pix; chave: string; id: number; expiraEm: number }
type Aviso = { cor: string; texto: string }

export function ComChaveDeIdempotencia() {
  const [atualizacao, setAtualizacao] = useState(0)
  const [pix, setPix] = useState(PIX_INICIAL)
  // Uma chave por intenção de pagamento: todos os cliques deste Pix mandam a mesma.
  const [chave, setChave] = useState(() => crypto.randomUUID())
  // O último Pix confirmado, para simular um retry dele mais tarde.
  const [ultimo, setUltimo] = useState<Envio>()
  const [aviso, setAviso] = useState<Aviso>()
  const [agora, setAgora] = useState(Date.now())

  // Contagem da validade da chave do último Pix; para quando ela expira.
  useEffect(() => {
    if (!ultimo) return
    const intervalo = setInterval(() => {
      setAgora(Date.now())
      if (Date.now() >= ultimo.expiraEm) clearInterval(intervalo)
    }, 250)
    return () => clearInterval(intervalo)
  }, [ultimo])

  const segundosRestantes = ultimo ? Math.max(0, Math.ceil((ultimo.expiraEm - agora) / 1000)) : 0

  function mostrar(cor: string, texto: string) {
    setAviso({ cor, texto })
    monitor.tela(texto)
  }

  function mostrarErro(erro: unknown) {
    const code = codeDoErro(erro)
    if (code === 'IDEMPOTENCY_KEY_IN_PROGRESS') {
      mostrar('blue', 'Esse Pix ainda está sendo processado. Nenhum Pix novo foi enviado.')
    } else if (code === 'IDEMPOTENCY_KEY_REUSED') {
      mostrar('red', 'O Pix mudou no meio do envio. Espere o primeiro terminar e envie de novo.')
    } else {
      mostrar('red', erro instanceof Error ? erro.message : 'Erro inesperado')
    }
  }

  // O botão fica liberado de propósito, para mostrar que agora quem protege é a API.
  async function aoClicar() {
    monitor.marca('clicou em Transferir')
    const enviadoEm = Date.now()
    try {
      const { id } = await transferir(pix, chave)
      setUltimo({ pix, chave, id, expiraEm: enviadoEm + VALIDADE_DA_CHAVE_MS })
      mostrar('green', `Pix #${id} confirmado`)
      setAtualizacao((n) => n + 1)
      // Pix concluído: o próximo é outra intenção, com outra chave.
      setChave(crypto.randomUUID())
    } catch (erro) {
      mostrarErro(erro)
    }
  }

  // Simula um retry: a resposta se perdeu na volta e o app manda o mesmo Pix, com a mesma chave.
  async function repetirUltimo() {
    if (!ultimo) return
    monitor.marca('repetiu o último envio')
    const enviadoEm = Date.now()
    try {
      const { id } = await transferir(ultimo.pix, ultimo.chave)
      if (id === ultimo.id) {
        mostrar('blue', `A API devolveu o mesmo Pix #${id}. Nenhum Pix novo foi enviado.`)
        return
      }
      // A chave expirou: para a API é um pedido novo. Por isso, na vida real, ela vale bem mais que o maior retry (24h).
      mostrar('orange', `A chave tinha expirado: a API enviou outro Pix (#${id}).`)
      setUltimo({ ...ultimo, id, expiraEm: enviadoEm + VALIDADE_DA_CHAVE_MS })
      setAtualizacao((n) => n + 1)
    } catch (erro) {
      mostrarErro(erro)
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

      {ultimo && (
        <Group>
          <Button variant="default" onClick={repetirUltimo}>
            Repetir o último envio
          </Button>
          <Text size="sm" c="dimmed">
            Chave {ultimo.chave.slice(0, 8)}{' '}
            {segundosRestantes > 0 ? `vale por mais ${segundosRestantes}s` : 'expirou'}
          </Text>
        </Group>
      )}

      <TabelaDeTransferencias atualizacao={atualizacao} />
    </Stack>
  )
}
