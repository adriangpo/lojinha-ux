import { Alert, Card, Image, SimpleGrid, Stack, Text } from '@mantine/core'
import { formatarPreco } from '../../lib/produtos'

export type ItemDaVitrine = { id: number; nome: string; precoCentavos: number; foto: string }

// Parte visual compartilhada. Mostra a data da assinatura que vem dentro da URL (X-Amz-Date):
// se ela muda a cada F5, a URL muda, e o navegador baixa todas as fotos de novo.
export function Vitrine({ itens }: { itens: ItemDaVitrine[] }) {
  // "20261012T020000Z" → "2026-10-12T02:00:00Z" → hora local.
  const assinadaEm = new URL(itens[0].foto).searchParams.get('X-Amz-Date') ?? ''
  const iso = assinadaEm.replace(/^(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)Z$/, '$1-$2-$3T$4:$5:$6Z')
  const hora = new Date(iso).toLocaleTimeString('pt-BR')

  return (
    <Stack>
      <Alert variant="light">
        URLs assinadas às <b>{hora}</b>. Dê F5 e veja se a hora muda, e na aba Rede ao lado se as fotos vieram da rede ou do cache.
      </Alert>
      <SimpleGrid cols={{ base: 2, md: 4 }}>
        {itens.map((item) => (
          <Card key={item.id} withBorder padding="sm">
            <Card.Section>
              <Image src={item.foto} h={140} />
            </Card.Section>
            <Text fw={600} mt="sm">
              {item.nome}
            </Text>
            <Text>{formatarPreco(item.precoCentavos)}</Text>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  )
}
