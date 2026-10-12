import { Card, SimpleGrid, Skeleton, Stack } from '@mantine/core'
import { useEffect, useState } from 'react'
import { ListaDeProdutos } from '../../componentes/ListaDeProdutos'
import { SeletorDeCategoria } from '../../componentes/SeletorDeCategoria'
import { monitor } from '../../lib/monitor'
import { buscarProdutos, CATEGORIAS, type Produto } from '../../lib/produtos'

export function ListaComSkeleton() {
  const [categoria, setCategoria] = useState(CATEGORIAS[0])
  const [produtos, setProdutos] = useState<Produto[]>()

  useEffect(() => {
    let ativo = true
    setProdutos(undefined)
    monitor.tela('skeleton')

    buscarProdutos({ categoria }).then((dados) => {
      if (!ativo) return
      setProdutos(dados)
      monitor.tela('lista')
    })

    return () => {
      ativo = false
    }
  }, [categoria])

  return (
    <Stack>
      <SeletorDeCategoria valor={categoria} aoMudar={setCategoria} />
      {produtos ? <ListaDeProdutos produtos={produtos} /> : <CardsFantasmas />}
    </Stack>
  )
}

// Mesma grade e mesmo formato dos cards de ListaDeProdutos (nome, categoria, preço):
// o usuário já vê onde cada coisa vai aparecer, e nada pula quando os dados chegam.
function CardsFantasmas() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i} withBorder padding="md">
          <Skeleton height={16} width="70%" mt={4} />
          <Skeleton height={18} width={90} radius="xl" mt={12} />
          <Skeleton height={22} width={100} mt={16} />
        </Card>
      ))}
    </SimpleGrid>
  )
}
