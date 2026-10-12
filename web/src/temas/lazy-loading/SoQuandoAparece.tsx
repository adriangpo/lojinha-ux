import { SimpleGrid, Stack } from '@mantine/core'
import { ContadorDeDownloads } from './ContadorDeDownloads'

const FOTOS = Array.from({ length: 200 }, (_, indice) => indice + 1)

// loading="lazy": o navegador só baixa a imagem quando ela está chegando perto da tela.
// width e height são obrigatórios aqui: sem eles, todas as imagens começam com altura 0,
// cabem juntas na tela e o navegador baixa todas.
export function SoQuandoAparece() {
  return (
    <Stack>
      <ContadorDeDownloads />
      <SimpleGrid cols={4}>
        {FOTOS.map((id) => (
          <img
            key={id}
            src={`/api/imagens/${id}`}
            loading="lazy"
            width={640}
            height={480}
            style={{ width: '100%', height: 'auto' }}
          />
        ))}
      </SimpleGrid>
    </Stack>
  )
}
