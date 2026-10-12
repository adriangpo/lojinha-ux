import { Loader } from '@mantine/core'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Vitrine, type ItemDaVitrine } from './Vitrine'

// O front é igual nas duas versões; a diferença está na API (api/src/rotas/signed-url.ts).
export function UrlReaproveitada() {
  const [itens, setItens] = useState<ItemDaVitrine[]>()

  useEffect(() => {
    api<ItemDaVitrine[]>('/vitrine/url-reaproveitada').then(setItens)
  }, [])

  return itens ? <Vitrine itens={itens} /> : <Loader />
}
