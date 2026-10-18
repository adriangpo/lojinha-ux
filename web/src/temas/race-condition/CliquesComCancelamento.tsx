import { Stack } from '@mantine/core'
import { useRef, useState } from 'react'
import { monitor } from '../../lib/monitor'
import type { Produto } from '../../lib/produtos'
import { AbasDeCategorias } from './AbasDeCategorias'
import { buscarDaCategoria } from './categoriaLenta'
import { CorridaDosCliques } from './CorridaDosCliques'

export function CliquesComCancelamento() {
  const [categoria, setCategoria] = useState<string | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  // O controller da requisição do clique anterior, para poder cancelá-la.
  const anterior = useRef<AbortController>(null)

  async function escolher(nova: string) {
    monitor.marca(`clicou em ${nova}`)
    setCategoria(nova)

    // Cancela a requisição do clique anterior: a resposta dela nunca vai chegar na tela.
    anterior.current?.abort()
    const controller = new AbortController()
    anterior.current = controller

    try {
      const resposta = await buscarDaCategoria(nova, controller.signal)
      setProdutos(resposta)
      monitor.tela(`mostrou produtos de ${nova}`)
    } catch (erro) {
      // Fomos nós que cancelamos: não é um erro de verdade.
      if (!controller.signal.aborted) throw erro
    }
  }

  return (
    <Stack>
      <AbasDeCategorias categoria={categoria} produtos={produtos} aoEscolher={escolher} />
      <CorridaDosCliques escolhida={categoria} />
    </Stack>
  )
}
