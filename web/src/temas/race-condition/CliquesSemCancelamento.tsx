import { Stack } from '@mantine/core'
import { useState } from 'react'
import { monitor } from '../../lib/monitor'
import type { Produto } from '../../lib/produtos'
import { AbasDeCategorias } from './AbasDeCategorias'
import { buscarDaCategoria } from './categoriaLenta'
import { CorridaDosCliques } from './CorridaDosCliques'

export function CliquesSemCancelamento() {
  const [categoria, setCategoria] = useState<string | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])

  // Cada clique dispara uma requisição, e as anteriores continuam no ar.
  // A que responder por último ganha - e nem sempre é a do último clique.
  async function escolher(nova: string) {
    monitor.marca(`clicou em ${nova}`)
    setCategoria(nova)

    const resposta = await buscarDaCategoria(nova)
    setProdutos(resposta)
    monitor.tela(`mostrou produtos de ${nova}`)
  }

  return (
    <Stack>
      <AbasDeCategorias categoria={categoria} produtos={produtos} aoEscolher={escolher} />
      <CorridaDosCliques escolhida={categoria} />
    </Stack>
  )
}
