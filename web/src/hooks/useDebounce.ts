import { useEffect, useState } from 'react'

// Devolve o valor só depois que ele ficar `atraso` ms sem mudar.
export function useDebounce<T>(valor: T, atraso: number) {
  const [valorComAtraso, setValorComAtraso] = useState(valor)

  useEffect(() => {
    const timer = setTimeout(() => setValorComAtraso(valor), atraso)

    // O valor mudou antes do tempo acabar? Cancela o timer e começa a contar de novo.
    return () => clearTimeout(timer)
  }, [valor, atraso])

  return valorComAtraso
}
