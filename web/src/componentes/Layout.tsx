import { AppShell, Burger, Button, Group, NavLink, ScrollArea, Text, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useEffect } from 'react'
import { NavLink as LinkDaRota, Outlet } from 'react-router'
import { observarNavegador } from '../lib/monitor'
import { BLOCOS, TEMAS } from '../temas'
import { AvisoDosControles } from './AvisoDosControles'
import { MiniConsole } from './MiniConsole'

export function Layout() {
  // Mostra no monitor as imagens e os saltos de layout, que não passam pelo lib/api.ts.
  useEffect(observarNavegador, [])
  const [menuAberto, { toggle: alternarMenu }] = useDisclosure(true)
  const [consoleAberto, { toggle: alternarConsole }] = useDisclosure(true)

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { desktop: !menuAberto, mobile: !menuAberto } }}
      aside={{ width: 480, breakpoint: 'md', collapsed: { desktop: !consoleAberto, mobile: true } }}
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
        <MiniConsole />
      </AppShell.Aside>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
