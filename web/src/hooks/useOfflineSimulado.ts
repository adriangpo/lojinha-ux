import { useEffect, useState } from 'react'
import { offlineSimulado, simularOffline } from '../lib/conexao'

// O "Offline" do monitor, para os controles: atualiza quando ele muda nesta aba ou em outra.
export function useOfflineSimulado() {
  const [offline, setOffline] = useState(offlineSimulado)

  useEffect(() => {
    const reler = () => setOffline(offlineSimulado())
    window.addEventListener('online', reler)
    window.addEventListener('offline', reler)
    return () => {
      window.removeEventListener('online', reler)
      window.removeEventListener('offline', reler)
    }
  }, [])

  return [offline, simularOffline] as const
}
