import { Badge, Button, Group } from '@mantine/core'
import { useEffect, useState } from 'react'

type Controle = { latencia: number | 'aleatoria'; taxaDeErro: number }

// Os controles ficam na aba /monitor e valem para todos os temas: aqui avisa quando estão ligados,
// para ninguém estranhar uma demo lenta ou cheia de erro porque esqueceu de zerar.
// Usa fetch direto (sem lib/api.ts) para não aparecer no painel de rede.
export function AvisoDosControles() {
  const [controle, setControle] = useState<Controle>()

  useEffect(() => {
    const ler = () =>
      fetch('/api/controle')
        .then((resposta) => resposta.json())
        .then(setControle)
        .catch(() => undefined)
    ler()
    const timer = setInterval(ler, 2000)
    return () => clearInterval(timer)
  }, [])

  async function zerar() {
    const resposta = await fetch('/api/controle', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latencia: 0, taxaDeErro: 0 }),
    })
    setControle(await resposta.json())
  }

  if (!controle || (controle.latencia === 0 && controle.taxaDeErro === 0)) return null

  const partes = []
  if (controle.latencia !== 0) partes.push(`Latência ${controle.latencia === 'aleatoria' ? 'aleatória' : `${controle.latencia}ms`}`)
  if (controle.taxaDeErro !== 0) partes.push(`Erro ${controle.taxaDeErro}%`)

  return (
    <Group gap={6}>
      <Badge color="orange" variant="light" size="lg">
        ⚠ {partes.join(' · ')}
      </Badge>
      <Button size="xs" variant="subtle" color="orange" onClick={zerar}>
        Zerar
      </Button>
    </Group>
  )
}
