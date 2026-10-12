import { useEffect, useRef } from 'react'

// Devolve uma versão de `funcao` que roda no máximo uma vez a cada `intervalo` ms.
// Diferente do debounce, ela roda DURANTE a rajada de eventos, não só no fim.
export function useThrottle<T>(funcao: (valor: T) => void, intervalo: number) {
  const ultimaVez = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Saiu da tela: cancela a chamada que estava agendada.
  useEffect(() => () => clearTimeout(timer.current), [])

  return (valor: T) => {
    const rodar = () => {
      ultimaVez.current = Date.now()
      funcao(valor)
    }

    // Só a chamada mais recente importa: a agendada antes dela é descartada.
    clearTimeout(timer.current)

    const falta = ultimaVez.current + intervalo - Date.now()
    if (falta <= 0) rodar()
    // Chegou no meio do intervalo: roda no fim dele, para o último valor nunca se perder.
    else timer.current = setTimeout(rodar, falta)
  }
}
