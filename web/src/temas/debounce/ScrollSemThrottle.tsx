import { useState, type UIEvent } from 'react'
import { monitor } from '../../lib/monitor'
import { ListaRolavel, porcentagemDoScroll, trabalhoCaro, useMedicao } from './ListaRolavel'

export function ScrollSemThrottle() {
  const medicao = useMedicao()
  const [posicao, setPosicao] = useState(0)

  function aoRolar(evento: UIEvent<HTMLDivElement>) {
    // O navegador dispara dezenas de eventos de scroll por segundo...
    medicao.marcarEvento()

    // ...e o trabalho caro roda em todos eles: o scroll engasga.
    medicao.marcarExecucao()
    setPosicao(trabalhoCaro(porcentagemDoScroll(evento)))
    monitor.tela(`handler rodou: posição ${porcentagemDoScroll(evento)}%`)
  }

  return <ListaRolavel medicao={medicao} posicao={posicao} aoRolar={aoRolar} />
}
