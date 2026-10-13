import { useState, type UIEvent } from 'react'
import { useThrottle } from '../../hooks/useThrottle'
import { monitor } from '../../lib/monitor'
import { ListaRolavel, porcentagemDoScroll, trabalhoCaro, useMedicao } from './ListaRolavel'

export function ScrollComThrottle() {
  const medicao = useMedicao()
  const [posicao, setPosicao] = useState(0)

  // O mesmo trabalho caro roda no máximo a cada 200ms, por mais eventos que cheguem.
  const atualizarPosicao = useThrottle((porcentagem: number) => {
    medicao.marcarExecucao()
    setPosicao(trabalhoCaro(porcentagem))
    monitor.tela(`handler rodou: posição ${porcentagem}%`)
  }, 200)

  function aoRolar(evento: UIEvent<HTMLDivElement>) {
    // O navegador dispara dezenas de eventos de scroll por segundo.
    medicao.marcarEvento()
    atualizarPosicao(porcentagemDoScroll(evento))
  }

  return <ListaRolavel medicao={medicao} posicao={posicao} aoRolar={aoRolar} />
}
