import { AppShell, Burger, Button, Group, NavLink, ScrollArea, Text, Title } from '@mantine/core'
import { useDisclosure, useWindowEvent } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import { NavLink as LinkDaRota, Outlet } from 'react-router'
import { observarNavegador } from '../lib/monitor'
import { BLOCOS, TEMAS } from '../temas'
import { AvisoDosControles } from './AvisoDosControles'
import { MiniConsole } from './MiniConsole'

export function Layout() {
  // Mostra no monitor as imagens e os saltos de layout, que não passam pelo lib/api.ts.
  useEffect(observarNavegador, [])
  const [menuAberto, { toggle: alternarMenu }] = useDisclosure(true)
  const [consoleAberto, { toggle: alternarConsole, close: fecharConsole }] = useDisclosure(true)
  const [larguraDoConsole, setLarguraDoConsole] = useState(480)
  const [arrastando, setArrastando] = useState(false)
  // Se a janela encolher, o console encolhe junto em vez de passar da borda.
  useWindowEvent('resize', () => setLarguraDoConsole((largura) => Math.min(largura, window.innerWidth * 0.7)))

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { desktop: !menuAberto, mobile: !menuAberto } }}
      // breakpoint 0: o console nunca entra no modo "celular" (que o escondia em telas estreitas).
      // Aberto, ele fica fixo do lado direito em qualquer largura; a borda arrastável ajusta o tamanho.
      aside={{ width: larguraDoConsole, breakpoint: 0, collapsed: { desktop: !consoleAberto } }}
      // Sem animação enquanto arrasta, senão o painel fica atrás do mouse.
      transitionDuration={arrastando ? 0 : 200}
      padding="lg"
    >
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <Group gap="sm">
            <Burger opened={menuAberto} onClick={alternarMenu} size="sm" aria-label="Mostrar ou esconder o menu" />
            <Title order={3}>Lojinha UX</Title>
          </Group>
          <Group gap="sm">
            <AvisoDosControles />
            <Button variant={consoleAberto ? 'filled' : 'light'} onClick={alternarConsole}>
              Console
            </Button>
            <Button component="a" href="/monitor" target="_blank" variant="light">
              Abrir monitor
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <ScrollArea p="sm">
          {BLOCOS.map((bloco) => (
            <div key={bloco}>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mt="md" mb={4} px="sm">
                {bloco}
              </Text>
              {TEMAS.filter((tema) => tema.bloco === bloco).map((tema) => (
                <NavLink
                  key={tema.slug}
                  component={LinkDaRota}
                  to={`/${tema.slug}`}
                  label={tema.titulo}
                  c={tema.versoes.length === 0 ? 'dimmed' : undefined}
                />
              ))}
            </div>
          ))}
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Aside>
        {/* Borda arrastável, como a divisória do DevTools. O pointer capture segue o mouse mesmo fora dela. */}
        <div
          onPointerDown={(evento) => {
            evento.preventDefault()
            evento.currentTarget.setPointerCapture(evento.pointerId)
            setArrastando(true)
          }}
          onPointerMove={(evento) => {
            if (!arrastando) return
            const largura = window.innerWidth - evento.clientX
            setLarguraDoConsole(Math.min(Math.max(largura, 320), window.innerWidth * 0.7))
          }}
          onPointerUp={() => setArrastando(false)}
          style={{ position: 'absolute', top: 0, bottom: 0, left: -3, width: 6, cursor: 'col-resize', zIndex: 1 }}
        />
        <MiniConsole fechar={fecharConsole} />
      </AppShell.Aside>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
