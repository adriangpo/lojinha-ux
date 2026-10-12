import { Stack } from '@mantine/core'
import { useEffect, useState } from 'react'
import { CampoDeBusca } from '../../componentes/CampoDeBusca'
import { monitor } from '../../lib/monitor'
import { buscarProdutos } from '../../lib/produtos'
import { ResultadoDaBusca, type Resultado } from './ResultadoDaBusca'

export function BuscaSemCancelamento() {
  const [busca, setBusca] = useState('')
  const [resultado, setResultado] = useState<Resultado>()

  // Várias requisições ficam no ar ao mesmo tempo.
  // A que responder por último ganha — e nem sempre é a mais recente.
  useEffect(() => {
    buscarProdutos({ busca }).then((produtos) => {
      setResultado({ busca, produtos })
      monitor.tela(`mostrou resultados de “${busca}”`)
    })
  }, [busca])

  return (
    <Stack>
      <CampoDeBusca valor={busca} aoMudar={setBusca} />
      <ResultadoDaBusca digitado={busca} resultado={resultado} />
    </Stack>
  )
}
