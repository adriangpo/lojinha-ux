import { Badge, Button, Group, Modal, SegmentedControl, Tabs, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Highlight, themes } from 'prism-react-renderer'
import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { arquivosDaVersao, type Arquivo } from '../lib/codigoFonte'

type Versao = { nome: string; componente: ComponentType }

// Botão "Ver código" da página do tema: abre os arquivos da versão escolhida, prontos para projetar.
// Dentro do modal dá para trocar de versão e comparar a ruim com a boa sem fechar.
export function VerCodigo({ titulo, versoes, versaoDaPagina }: { titulo: string; versoes: Versao[]; versaoDaPagina: string }) {
  const [aberto, { open, close: fechar }] = useDisclosure(false)
  const [nomeDaVersao, setNomeDaVersao] = useState(versaoDaPagina)
  const versao = versoes.find((v) => v.nome === nomeDaVersao) ?? versoes[0]
  const arquivos = useMemo(() => arquivosDaVersao(versao.componente.name), [versao])
  const [aba, setAba] = useState<string | null>(null)
  // Trocando de versão, continua no mesmo arquivo quando ele existe nas duas (a rota da API, por exemplo).
  const atual = arquivos.find((arquivo) => arquivo.nome === aba) ?? arquivos[0]

  // Abre sempre na versão que está na tela.
  function abrir() {
    setNomeDaVersao(versaoDaPagina)
    setAba(null)
    open()
  }

  if (!atual) return null

  return (
    <>
      <Button variant="default" onClick={abrir}>
        Ver código
      </Button>

      <Modal
        opened={aberto}
        onClose={fechar}
        size="90%"
        title={
          <Group gap="md">
            <Text fw={700}>{titulo}</Text>
            {versoes.length > 1 && (
              <SegmentedControl size="xs" data={versoes.map((v) => v.nome)} value={versao.nome} onChange={setNomeDaVersao} />
            )}
          </Group>
        }
        styles={{ body: { display: 'flex', flexDirection: 'column', height: '80vh' } }}
      >
        <Tabs value={atual.nome} onChange={setAba} mb="xs">
          <Tabs.List style={{ flexWrap: 'wrap' }}>
            {arquivos.map((arquivo) => (
              <Tabs.Tab
                key={arquivo.nome}
                value={arquivo.nome}
                rightSection={
                  <Badge size="xs" variant="light" color={arquivo.lado === 'API' ? 'grape' : 'blue'}>
                    {arquivo.lado}
                  </Badge>
                }
              >
                {arquivo.nome}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

        <Codigo arquivo={atual} />
      </Modal>
    </>
  )
}

function Codigo({ arquivo }: { arquivo: Arquivo }) {
  // As chamadas ao monitor só existem para a demo: escondidas, sobra o código de produção.
  const escondidas = linhasDoMonitor(arquivo.codigo)
  const primeiroDestaque = useRef<HTMLDivElement>(null)

  // Na API, abre já mostrando a rota que esta tela chama.
  useEffect(() => {
    primeiroDestaque.current?.scrollIntoView({ block: 'center' })
  }, [arquivo])

  return (
    <Highlight theme={themes.vsLight} code={arquivo.codigo.trimEnd()} language="tsx">
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre style={{ ...style, flex: 1, margin: 0, overflow: 'auto', padding: '12px 0', fontSize: 15, lineHeight: 1.55, borderRadius: 6, border: '1px solid var(--mantine-color-gray-3)' }}>
          {tokens.map((linha, indice) => {
            const numero = indice + 1
            if (escondidas.has(numero)) return null
            // Numera só as linhas que aparecem, como se as do monitor nunca tivessem existido.
            const numeroVisivel = numero - [...escondidas].filter((escondida) => escondida < numero).length
            const destacada = arquivo.destaques.includes(numero)
            return (
              <div
                key={indice}
                ref={numero === arquivo.destaques[0] ? primeiroDestaque : undefined}
                {...getLineProps({ line: linha })}
                style={{ display: 'flex', background: destacada ? '#fff8c5' : undefined, borderLeft: `3px solid ${destacada ? '#d4a72c' : 'transparent'}` }}
              >
                <span style={{ width: 44, flexShrink: 0, textAlign: 'right', paddingRight: 14, color: '#a0a0a0', userSelect: 'none' }}>{numeroVisivel}</span>
                <span style={{ whiteSpace: 'pre-wrap', paddingRight: 12 }}>
                  {linha.map((token, i) => (
                    <span key={i} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            )
          })}
        </pre>
      )}
    </Highlight>
  )
}

// Linhas que só servem ao monitor: o import dele e as chamadas monitor.xxx(...), mesmo quando quebram em várias linhas.
function linhasDoMonitor(codigo: string) {
  const escondidas = new Set<number>()
  let abertos = 0
  codigo.split('\n').forEach((linha, indice) => {
    const doMonitor = /^\s*(?:await\s+)?monitor\./.test(linha) || /from '[./]*lib\/monitor'/.test(linha) || /^\s*\/\/.*monitor/i.test(linha)
    if (abertos > 0 || doMonitor) {
      escondidas.add(indice + 1)
      abertos += (linha.match(/\(/g) ?? []).length - (linha.match(/\)/g) ?? []).length
      if (abertos < 0) abertos = 0
    }
  })
  return escondidas
}
