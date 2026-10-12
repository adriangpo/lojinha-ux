import { Box, Paper, ScrollArea, Text } from '@mantine/core'
import { useEffect, useRef } from 'react'
import type { Faixa } from '../lib/monitor'
import { aparenciaDoTrecho, COR_DA_MARCA, FAIXAS } from './aparencia'
import type { Trecho } from './useEventos'

type Mensagem = {
  id: string
  em: number
  de: Faixa
  para: Faixa
  rotulo: string
  // Tracejada: resposta ou mensagem empurrada pelo servidor.
  tracejada: boolean
  cor: string
}

const ALTURA_DA_LINHA = 36
const LARGURA_DO_TEMPO = 70
const MAXIMO = 60

// Centro de cada faixa, em % da largura.
const centro = (faixa: Faixa) => {
  const indice = FAIXAS.findIndex((f) => f.faixa === faixa)
  return ((indice + 0.5) / FAIXAS.length) * 100
}

// Diagrama de sequência: cada mensagem entre as partes vira uma seta, em ordem.
export function Sequencia({ trechos }: { trechos: Trecho[] }) {
  const mensagens = montarMensagens(trechos).slice(-MAXIMO)
  const primeiro = mensagens[0]?.em ?? 0

  // Rola sozinho para a mensagem mais nova.
  const areaDeRolagem = useRef<HTMLDivElement>(null)
  useEffect(() => {
    areaDeRolagem.current?.scrollTo({ top: areaDeRolagem.current.scrollHeight })
  }, [mensagens.length])

  return (
    <Paper withBorder p="md">
      <Box style={{ display: 'flex' }} mb={4}>
        <Box w={LARGURA_DO_TEMPO} style={{ flexShrink: 0 }} />
        {FAIXAS.map(({ faixa, nome }) => (
          <Text key={faixa} fw={600} ta="center" style={{ flex: 1 }}>
            {nome}
          </Text>
        ))}
      </Box>

      <ScrollArea h={560} viewportRef={areaDeRolagem}>
        {mensagens.map((mensagem) => (
          <Box key={`${mensagem.id}-${mensagem.em}`} style={{ display: 'flex' }}>
            <Text size="xs" c="dimmed" w={LARGURA_DO_TEMPO} style={{ flexShrink: 0, lineHeight: `${ALTURA_DA_LINHA}px` }}>
              +{((mensagem.em - primeiro) / 1000).toFixed(2)}s
            </Text>
            <Seta mensagem={mensagem} />
          </Box>
        ))}
      </ScrollArea>
    </Paper>
  )
}

function Seta({ mensagem }: { mensagem: Mensagem }) {
  const x1 = centro(mensagem.de)
  const x2 = centro(mensagem.para)
  const { cor } = mensagem
  const ponta = x2 > x1 ? -1 : 1
  const linhasDasFaixas = FAIXAS.map(({ faixa }) => (
    <line key={faixa} x1={`${centro(faixa)}%`} x2={`${centro(faixa)}%`} y1={0} y2={ALTURA_DA_LINHA} stroke="var(--mantine-color-gray-3)" />
  ))

  // Algo que acontece numa parte só (ex.: esperar): só o texto, sem seta.
  if (x1 === x2) {
    return (
      <svg width="100%" height={ALTURA_DA_LINHA} style={{ flex: 1, overflow: 'visible' }}>
        {linhasDasFaixas}
        <text x={`${x1}%`} y={22} textAnchor="middle" fontSize={12} fill={cor}>
          {mensagem.rotulo}
        </text>
      </svg>
    )
  }

  return (
    <svg width="100%" height={ALTURA_DA_LINHA} style={{ flex: 1, overflow: 'visible' }}>
      {linhasDasFaixas}
      <line x1={`${x1}%`} x2={`${x2}%`} y1={26} y2={26} stroke={cor} strokeWidth={2} strokeDasharray={mensagem.tracejada ? '6 4' : undefined} />
      <svg x={`${x2}%`} y={26} overflow="visible">
        <path d={`M ${ponta * 8} -5 L 0 0 L ${ponta * 8} 5`} fill="none" stroke={cor} strokeWidth={2} />
      </svg>

      <text x={`${(x1 + x2) / 2}%`} y={18} textAnchor="middle" fontSize={12} fill={cor}>
        {mensagem.rotulo}
      </text>
    </svg>
  )
}

function montarMensagens(trechos: Trecho[]): Mensagem[] {
  const porId = new Map(trechos.map((trecho) => [trecho.id, trecho]))
  const mensagens: Mensagem[] = []
  const ida = 'var(--mantine-color-dark-4)'
  const corDaVolta = (trecho: Trecho) => {
    const { fundo, borda } = aparenciaDoTrecho(trecho)
    return borda ? 'var(--mantine-color-teal-7)' : fundo
  }

  for (const trecho of trechos) {
    const base = { id: trecho.id, em: trecho.inicio }

    if (trecho.instantaneo) {
      if (trecho.de) {
        // Mensagem empurrada pelo servidor, sem ninguém ter pedido (NOTIFY, SSE).
        mensagens.push({ ...base, de: trecho.de, para: trecho.faixa, rotulo: `⇠ ${trecho.rotulo}`, tracejada: true, cor: COR_DA_MARCA.api })
      } else if (trecho.faixa === 'usuario') {
        mensagens.push({ ...base, de: 'usuario', para: 'navegador', rotulo: trecho.rotulo, tracejada: false, cor: ida })
      } else if (trecho.faixa === 'tela') {
        mensagens.push({ ...base, de: 'navegador', para: 'tela', rotulo: trecho.rotulo, tracejada: false, cor: COR_DA_MARCA.tela })
      } else if (trecho.estilo === 'cache') {
        mensagens.push({ ...base, de: 'navegador', para: 'navegador', rotulo: `⚡ ${trecho.rotulo}`, tracejada: false, cor: COR_DA_MARCA.navegador })
      }
      continue
    }

    if (trecho.faixa === 'navegador') {
      if (trecho.estilo === 'espera') {
        mensagens.push({ ...base, de: 'navegador', para: 'navegador', rotulo: `⏳ ${trecho.rotulo}`, tracejada: false, cor: 'var(--mantine-color-gray-7)' })
      } else if (trecho.estilo === 'cache') {
        // Resolvido pelo cache do navegador: a API nem fica sabendo.
        mensagens.push({ ...base, de: 'navegador', para: 'navegador', rotulo: `⚡ ${trecho.rotulo} · cache`, tracejada: false, cor: COR_DA_MARCA.navegador })
      } else if (trecho.resultado === 'cancelada') {
        // O resto das requisições aparece pelas setas da API (abaixo). Aqui só o cancelamento.
        mensagens.push({ ...base, em: trecho.fim!, de: 'navegador', para: 'api', rotulo: `✕ cancelou ${trecho.rotulo}`, tracejada: true, cor: corDaVolta(trecho) })
      }
      continue
    }

    // API e banco: seta de ida quando começa, seta de volta quando termina.
    const origem = (trecho.pai && porId.get(trecho.pai)?.faixa) || (trecho.faixa === 'banco' ? 'api' : 'navegador')
    mensagens.push({ ...base, de: origem, para: trecho.faixa, rotulo: trecho.rotulo, tracejada: false, cor: ida })

    if (trecho.fim !== undefined && trecho.resultado !== 'cancelada') {
      // Na volta da API, repete o caminho (sem o método) para saber de qual requisição é a resposta.
      const caminho = trecho.faixa === 'api' ? `${trecho.rotulo.split(' ')[1]} · ` : ''
      mensagens.push({
        id: trecho.id,
        em: trecho.fim,
        de: trecho.faixa,
        para: origem,
        rotulo: `${caminho}${trecho.detalhe ?? trecho.resultado} · ${trecho.fim - trecho.inicio}ms`,
        tracejada: true,
        cor: corDaVolta(trecho),
      })
    }
  }

  return mensagens.sort((a, b) => a.em - b.em)
}
