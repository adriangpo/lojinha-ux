import { Alert, Stack } from '@mantine/core'
import { useEffect, useState } from 'react'
import { ErroDaApi } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { CampoDeCupom } from './CampoDeCupom'
import { aplicarCupom, type Mensagem } from './cupons'

export function ComRetryAfter() {
  const [mensagem, setMensagem] = useState<Mensagem>()
  const [segundos, setSegundos] = useState(0)

  // Contagem regressiva: tira 1 a cada segundo até chegar em zero.
  useEffect(() => {
    if (segundos <= 0) return
    const timer = setTimeout(() => setSegundos(segundos - 1), 1000)
    return () => clearTimeout(timer)
  }, [segundos])

  async function aplicar(codigo: string) {
    try {
      const { desconto } = await aplicarCupom('com-limite', codigo)
      setMensagem({ cor: 'green', texto: `Cupom aplicado: ${desconto}% de desconto.` })
      monitor.tela('cupom aplicado')
    } catch (erro) {
      // 429: a API diz no cabeçalho Retry-After quanto tempo esperar. A tela repassa isso ao usuário.
      if (erro instanceof ErroDaApi && erro.status === 429) {
        const espera = Number(erro.cabecalhos?.get('Retry-After') ?? 10)
        setSegundos(espera)
        setMensagem(undefined)
        monitor.tela(`botão bloqueado: tente em ${espera}s`)
        // Só desenha a espera no monitor; quem libera o botão é a contagem regressiva.
        monitor.esperar(`Retry-After ${espera}s`, espera * 1000)
        return
      }
      setMensagem({ cor: 'red', texto: erro instanceof ErroDaApi ? erro.message : 'Algo deu errado.' })
    }
  }

  const bloqueado = segundos > 0

  return (
    <Stack>
      <CampoDeCupom aoAplicar={aplicar} desabilitado={bloqueado} textoDoBotao={bloqueado ? `Aguarde ${segundos}s` : 'Aplicar'} />
      {bloqueado && (
        <Alert color="yellow">Muitas tentativas seguidas. Tente novamente em {segundos} segundos.</Alert>
      )}
      {mensagem && <Alert color={mensagem.cor}>{mensagem.texto}</Alert>}
    </Stack>
  )
}
