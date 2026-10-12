import { Alert, Button, Center, Loader, Stack, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { CampoDeBusca } from '../../componentes/CampoDeBusca'
import { ListaDeProdutos } from '../../componentes/ListaDeProdutos'
import { monitor } from '../../lib/monitor'
import { buscarProdutos } from '../../lib/produtos'

export function ListaComEstados() {
  const [busca, setBusca] = useState('')

  return (
    <Stack>
      <CampoDeBusca valor={busca} aoMudar={setBusca} />
      <Resultado busca={busca} aoLimpar={() => setBusca('')} />
    </Stack>
  )
}

// Um desenho para cada um dos quatro estados.
function Resultado({ busca, aoLimpar }: { busca: string; aoLimpar: () => void }) {
  const { data: produtos, isPending, isError, refetch } = useQuery({
    queryKey: ['produtos', 'busca', busca],
    queryFn: ({ signal }) => buscarProdutos({ busca }, signal),
    // Sem retries automáticos: eles são assunto de outro tema.
    retry: false,
  })

  // Avisa o monitor cada vez que a tela troca de estado.
  const estado = isPending ? 'carregando' : isError ? 'erro + Tentar de novo' : produtos.length === 0 ? 'vazio que orienta' : 'lista'
  useEffect(() => monitor.tela(estado), [estado])

  // 1. Carregando
  if (isPending) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    )
  }

  // 2. Erro: diz o que houve e oferece a saída.
  if (isError) {
    return (
      <Alert color="red" title="Não foi possível carregar os produtos">
        <Text size="sm" mb="sm">
          Pode ser a conexão ou o servidor. Sua busca continua aqui.
        </Text>
        <Button color="red" variant="light" onClick={() => refetch()}>
          Tentar de novo
        </Button>
      </Alert>
    )
  }

  // 3. Vazio: explica por que e orienta o próximo passo.
  if (produtos.length === 0) {
    return (
      <Alert color="gray" title={`Nenhum produto encontrado para “${busca}”`}>
        <Text size="sm" mb="sm">
          Confira a grafia ou tente uma palavra mais curta, como “fone”.
        </Text>
        <Button variant="light" color="gray" onClick={aoLimpar}>
          Ver todos os produtos
        </Button>
      </Alert>
    )
  }

  // 4. Sucesso
  return <ListaDeProdutos produtos={produtos} />
}
