import { useEffect, useState } from 'react'

// O "agora", atualizado a cada quadro enquanto `rodando`. Parado, congela no último valor.
export function useRelogio(rodando: boolean) {
  const [agora, setAgora] = useState(Date.now())

  useEffect(() => {
    if (!rodando) return
    let quadro = requestAnimationFrame(function atualizar() {
      setAgora(Date.now())
      quadro = requestAnimationFrame(atualizar)
    })
    return () => cancelAnimationFrame(quadro)
  }, [rodando])

  return agora
}
