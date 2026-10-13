import { SimpleGrid, Stack } from '@mantine/core'
import { ContadorDeDownloads } from './ContadorDeDownloads'

const FOTOS = Array.from({ length: 200 }, (_, indice) => indice + 1)

// O navegador baixa as 200 imagens assim que a página abre, mesmo as que ninguém vai ver.
export function TudoDeUmaVez() {
  return (
    <Stack>
      <ContadorDeDownloads />
      <SimpleGrid cols={2}>
        {FOTOS.map((id) => (
          <img key={id} src={`/api/imagens/${id}`} width={640} height={480} style={{ width: '100%', height: 'auto' }} />
        ))}
      </SimpleGrid>
    </Stack>
  )
}
