import { Stack } from '@mantine/core'
import { useEffect, useState } from 'react'
import { CampoDeBusca } from '../../componentes/CampoDeBusca'
import { monitor } from '../../lib/monitor'
import { buscarComDemora } from './buscaLenta'
import { CorridaDasBuscas } from './CorridaDasBuscas'
import { ResultadoDaBusca, type Resultado } from './ResultadoDaBusca'

export function BuscaComCancelamento() {
  const [busca, setBusca] = useState('')
  const [resultado, setResultado] = useState<Resultado>()

  useEffect(() => {
    const controller = new AbortController()

    buscarComDemora(busca, controller.signal)
      .then((produtos) => {
        setResultado({ busca, produtos })
        monitor.tela(`mostrou resultados de “${busca}”`)
      })
      .catch((erro) => {
        // Fomos nós que cancelamos: não é um erro de verdade.
        if (!controller.signal.aborted) throw erro
      })

    // Antes de rodar o efeito de novo, o React chama esta função:
    // a requisição anterior é cancelada e nunca vai sobrescrever o resultado.
    return () => controller.abort()
  }, [busca])

  return (
    <Stack>
      <CampoDeBusca valor={busca} aoMudar={setBusca} />
      <CorridaDasBuscas digitado={busca} />
      <ResultadoDaBusca digitado={busca} resultado={resultado} />
    </Stack>
  )
}
