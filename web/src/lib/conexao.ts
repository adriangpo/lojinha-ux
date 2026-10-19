// Offline de mentira, ligado pelo /monitor: mais rápido de mostrar do que DevTools → Network → Offline.
// Na aba da lojinha, navigator.onLine passa a dar false, os eventos 'offline'/'online' disparam de verdade
// e o lib/api.ts falha como um fetch sem rede. Assim o código das demos é o mesmo do offline real.
// O estado mora no localStorage: o navegador avisa as outras abas pelo evento 'storage'.

const CHAVE = 'offline-simulado'

const onLineDeVerdade = Object.getOwnPropertyDescriptor(Navigator.prototype, 'onLine')!.get!

export function offlineSimulado() {
  try {
    return localStorage.getItem(CHAVE) === '1'
  } catch {
    return false
  }
}

export function simularOffline(ligar: boolean) {
  localStorage.setItem(CHAVE, ligar ? '1' : '0')
  // A aba que mudou não recebe o 'storage': avisa ela mesma.
  aplicar()
}

// O último estado avisado, para não disparar 'offline' duas vezes seguidas.
let avisado = offlineSimulado()

function aplicar() {
  const agora = offlineSimulado()
  if (agora === avisado) return
  avisado = agora
  // Se a rede caiu de verdade, o navegador já avisou: não tem o que mudar.
  if (onLineDeVerdade.call(navigator)) window.dispatchEvent(new Event(agora ? 'offline' : 'online'))
}

// navigator.onLine responde o offline de mentira por cima do de verdade.
Object.defineProperty(navigator, 'onLine', {
  configurable: true,
  get: () => onLineDeVerdade.call(navigator) && !offlineSimulado(),
})

window.addEventListener('storage', (evento) => {
  if (evento.key === CHAVE) aplicar()
})
