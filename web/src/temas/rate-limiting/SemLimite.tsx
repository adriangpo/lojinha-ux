import { Alert, Stack } from '@mantine/core'
import { useState } from 'react'
import { ErroDaApi } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { CampoDeCupom } from './CampoDeCupom'
import { aplicarCupom, type Mensagem } from './cupons'

// A API aceita tudo: um robô pode testar milhares de cupons por segundo
// e, de quebra, derrubar o servidor para todo mundo.
export function SemLimite() {
  const [mensagem, setMensagem] = useState<Mensagem>()

  async function aplicar(codigo: string) {
    try {
      const { desconto } = await aplicarCupom('sem-limite', codigo)
      setMensagem({ cor: 'green', texto: `Cupom aplicado: ${desconto}% de desconto.` })
      monitor.tela('cupom aplicado')
    } catch (erro) {
      setMensagem({ cor: 'red', texto: erro instanceof ErroDaApi ? erro.message : 'Algo deu errado.' })
    }
  }

  return (
    <Stack>
      <CampoDeCupom aoAplicar={aplicar} />
      {mensagem && <Alert color={mensagem.cor}>{mensagem.texto}</Alert>}
    </Stack>
  )
}
