import { Button, Group, Stack, Table, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { monitor } from '../../lib/monitor'
import { limparPedidos, listarPedidos, type Pedido } from './pedidos'

// A prova do crime: o que de fato ficou gravado no banco.
// Busca de novo sempre que "atualizacao" muda (a cada compra que termina).
export function TabelaDePedidos({ atualizacao }: { atualizacao: number }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([])

  useEffect(() => {
    listarPedidos().then((lista) => {
      setPedidos(lista)
      monitor.tela(`tabela: ${lista.length} pedidos`)
    })
  }, [atualizacao])

  async function limpar() {
    await limparPedidos()
    setPedidos(await listarPedidos())
  }

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Title order={4}>Pedidos no banco: {pedidos.length}</Title>
        <Button variant="default" size="xs" onClick={limpar}>
          Limpar pedidos
        </Button>
      </Group>

      {pedidos.length === 0 ? (
        <Text c="dimmed">Nenhum pedido ainda.</Text>
      ) : (
        <Table striped withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th>Produto</Table.Th>
              <Table.Th>Chave de idempotência</Table.Th>
              <Table.Th>Criado em</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {pedidos.map((pedido) => (
              <Table.Tr key={pedido.id}>
                <Table.Td>{pedido.id}</Table.Td>
                <Table.Td>{pedido.produto}</Table.Td>
                <Table.Td>{pedido.chave?.slice(0, 8) ?? '—'}</Table.Td>
                <Table.Td>{new Date(pedido.criadoEm).toLocaleTimeString('pt-BR')}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  )
}
