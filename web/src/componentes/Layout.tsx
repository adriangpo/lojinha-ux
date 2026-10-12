import { AppShell, Button, Group, NavLink, ScrollArea, Text, Title } from '@mantine/core'
import { useEffect } from 'react'
import { NavLink as LinkDaRota, Outlet } from 'react-router'
import { observarNavegador } from '../lib/monitor'
import { BLOCOS, TEMAS } from '../temas'

export function Layout() {
  // Mostra no monitor as imagens e os saltos de layout, que não passam pelo lib/api.ts.
  useEffect(observarNavegador, [])

  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 300, breakpoint: 'sm' }} padding="lg">
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <Title order={3}>Lojinha UX</Title>
          <Button component="a" href="/monitor" target="_blank" variant="light">
            Abrir monitor
          </Button>
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

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
