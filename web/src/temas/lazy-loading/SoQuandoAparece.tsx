import { SimpleGrid, Stack } from '@mantine/core'
import { useState } from 'react'
import { ContadorDeDownloads } from './ContadorDeDownloads'

const FOTOS = Array.from({ length: 200 }, (_, indice) => indice + 1)

// loading="lazy": o navegador só baixa a imagem quando ela está chegando perto da tela.
// "Perto" é generoso: o Chrome começa a baixar umas ~1.250px antes de a imagem aparecer.
// width e height são obrigatórios aqui: sem eles, todas as imagens começam com altura 0,
// cabem juntas na tela e o navegador baixa todas.
export function SoQuandoAparece() {
  // O navegador guarda na memória as imagens que a aba já mostrou (mesmo com no-store).
  // O ?visita= muda cada vez que a tela abre: as fotos vêm da API de novo, como numa primeira visita.
  const [visita] = useState(() => Date.now())

  return (
    <Stack>
      <ContadorDeDownloads />
      <SimpleGrid cols={2}>
        {FOTOS.map((id) => (
          <img
            key={id}
            src={`/api/imagens/${id}?visita=${visita}`}
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
