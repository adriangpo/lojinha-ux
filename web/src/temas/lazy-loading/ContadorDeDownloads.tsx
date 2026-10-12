import { Paper, Text } from '@mantine/core'
import { useEffect, useState } from 'react'

// Infraestrutura: soma quantas imagens o navegador baixou desde que a tela abriu.
// O PerformanceObserver avisa a cada arquivo que termina de baixar.
export function ContadorDeDownloads() {
  const [imagens, setImagens] = useState(0)
  const [bytes, setBytes] = useState(0)

  useEffect(() => {
    const observador = new PerformanceObserver((lista) => {
      for (const entrada of lista.getEntries() as PerformanceResourceTiming[]) {
        if (!entrada.name.includes('/api/imagens/')) continue
        setImagens((total) => total + 1)
        setBytes((total) => total + entrada.transferSize)
      }
    })
    observador.observe({ type: 'resource' })
    return () => observador.disconnect()
  }, [])

  return (
    <Paper withBorder p="sm" pos="sticky" top={70} style={{ zIndex: 1 }}>
      <Text fw={600}>
        Imagens baixadas: {imagens} · {(bytes / 1024 / 1024).toFixed(1)} MB
      </Text>
    </Paper>
  )
}
