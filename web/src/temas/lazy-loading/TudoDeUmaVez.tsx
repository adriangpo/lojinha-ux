import { SimpleGrid, Stack } from '@mantine/core'
import { useState } from 'react'
import { ContadorDeDownloads } from './ContadorDeDownloads'

const FOTOS = Array.from({ length: 200 }, (_, indice) => indice + 1)

// O navegador baixa as 200 imagens assim que a página abre, mesmo as que ninguém vai ver.
export function TudoDeUmaVez() {
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
            width={640}
            height={480}
            style={{ width: '100%', height: 'auto' }}
          />
        ))}
      </SimpleGrid>
    </Stack>
  )
}
