import { Button, Group, Stack, Table, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { monitor } from '../../lib/monitor'
import { formatarPreco } from '../../lib/produtos'
import { limparTransferencias, listarTransferencias, type Transferencia } from './transferencias'

// A prova do crime: o que de fato ficou gravado no banco.
// Busca de novo sempre que "atualizacao" muda (a cada Pix que termina).
export function TabelaDeTransferencias({ atualizacao }: { atualizacao: number }) {
  const [transferencias, setTransferencias] = useState<Transferencia[]>([])

  useEffect(() => {
    listarTransferencias().then((lista) => {
      setTransferencias(lista)
      monitor.tela(`tabela: ${lista.length} Pix`)
    })
  }, [atualizacao])

  async function limpar() {
    await limparTransferencias()
    setTransferencias(await listarTransferencias())
  }

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Title order={4}>Pix no banco: {transferencias.length}</Title>
        <Button variant="default" size="xs" onClick={limpar}>
          Limpar Pix
        </Button>
      </Group>

      {transferencias.length === 0 ? (
        <Text c="dimmed">Nenhum Pix ainda.</Text>
      ) : (
        <Table striped withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th>Para</Table.Th>
              <Table.Th>Valor</Table.Th>
              <Table.Th>Chave de idempotência</Table.Th>
              <Table.Th>Criado em</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {transferencias.map((transferencia) => (
              <Table.Tr key={transferencia.id}>
                <Table.Td>{transferencia.id}</Table.Td>
                <Table.Td>{transferencia.para}</Table.Td>
                <Table.Td>{formatarPreco(transferencia.valorCentavos)}</Table.Td>
                <Table.Td>{transferencia.chave?.slice(0, 8) ?? '-'}</Table.Td>
                <Table.Td>{new Date(transferencia.criadoEm).toLocaleTimeString('pt-BR')}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  )
}
