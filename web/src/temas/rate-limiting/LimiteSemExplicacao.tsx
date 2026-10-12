import { Alert, Stack } from '@mantine/core'
import { useState } from 'react'
import { ErroDaApi } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { CampoDeCupom } from './CampoDeCupom'
import { aplicarCupom, type Mensagem } from './cupons'

// A API já se protege (429), mas o front trata todo erro igual:
// o usuário não sabe que foi bloqueado, nem por quanto tempo, e continua clicando.
export function LimiteSemExplicacao() {
  const [mensagem, setMensagem] = useState<Mensagem>()

  async function aplicar(codigo: string) {
    try {
      const { desconto } = await aplicarCupom('com-limite', codigo)
      setMensagem({ cor: 'green', texto: `Cupom aplicado: ${desconto}% de desconto.` })
      monitor.tela('cupom aplicado')
    } catch (erro) {
      const naoEncontrado = erro instanceof ErroDaApi && erro.status === 404
      setMensagem({ cor: 'red', texto: naoEncontrado ? erro.message : 'Algo deu errado.' })
      monitor.tela(naoEncontrado ? 'cupom não encontrado' : '"Algo deu errado."')
    }
  }

  return (
    <Stack>
      <CampoDeCupom aoAplicar={aplicar} />
      {mensagem && <Alert color={mensagem.cor}>{mensagem.texto}</Alert>}
    </Stack>
  )
}
