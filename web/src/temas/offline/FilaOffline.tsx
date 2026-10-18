import { Alert, Badge, Stack } from '@mantine/core'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { buscarProdutos, type Produto } from '../../lib/produtos'
import { GradeDeFavoritos } from './GradeDeFavoritos'

type Acao = { produtoId: number; favoritar: boolean }

// A fila mora no localStorage: sobrevive a fechar a aba e voltar depois.
const CHAVE = 'fila-de-favoritos'
const lerFila = (): Acao[] => JSON.parse(localStorage.getItem(CHAVE) ?? '[]')
const salvarFila = (fila: Acao[]) => localStorage.setItem(CHAVE, JSON.stringify(fila))

export function FilaOffline() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [favoritos, setFavoritos] = useState<number[]>([])
  const [online, setOnline] = useState(navigator.onLine)
  const [pendentes, setPendentes] = useState(lerFila().length)
  const enviando = useRef(false)

  // Manda a fila para a API, em ordem. Cada ação só sai da fila depois que a API confirmar.
  // Se cair no meio, a mesma ação vai de novo depois: sem problema, PUT e DELETE são idempotentes.
  async function enviarFila() {
    // Um envio por vez: dois ao mesmo tempo mandariam a mesma ação duas vezes.
    if (enviando.current || !navigator.onLine) return
    enviando.current = true
    try {
      for (let fila = lerFila(); fila.length > 0; fila = lerFila()) {
        const [acao] = fila
        await api(`/favoritos/${acao.produtoId}`, { method: acao.favoritar ? 'PUT' : 'DELETE' })
        salvarFila(lerFila().slice(1))
        setPendentes(lerFila().length)
      }
    } catch {
      // A conexão caiu de novo ou a API falhou: o resto fica na fila para a próxima vez.
    } finally {
      enviando.current = false
    }
  }

  useEffect(() => {
    // Ao abrir, primeiro envia o que ficou de antes; só depois pergunta à API quais são os favoritos.
    buscarProdutos({ categoria: 'Livros' }).then((dados) => setProdutos(dados.slice(0, 6)))
    enviarFila().then(() => api<number[]>('/favoritos').then(setFavoritos))

    // O navegador avisa quando a conexão cai e quando volta.
    const aoCair = () => {
      setOnline(false)
      monitor.tela('aviso: sem conexão')
    }
    const aoVoltar = () => {
      setOnline(true)
      monitor.tela('conexão voltou: enviando a fila')
      enviarFila()
    }
    window.addEventListener('offline', aoCair)
    window.addEventListener('online', aoVoltar)
    return () => {
      window.removeEventListener('offline', aoCair)
      window.removeEventListener('online', aoVoltar)
    }
  }, [])

  function alternar(produto: Produto) {
    monitor.marca(`clicou no coração: ${produto.nome}`)
    const favoritar = !favoritos.includes(produto.id)

    // Com ou sem conexão, o caminho é o mesmo: a tela muda na hora e a ação entra na fila.
    setFavoritos((atuais) => (favoritar ? [...atuais, produto.id] : atuais.filter((id) => id !== produto.id)))
    salvarFila([...lerFila(), { produtoId: produto.id, favoritar }])
    setPendentes(lerFila().length)
    monitor.tela(favoritar ? 'coração vermelho na hora' : 'coração vazio na hora')
    enviarFila()
  }

  return (
    <Stack>
      {!online && (
        <Alert color="yellow" title="Você está sem conexão">
          Pode continuar: o que você fizer será enviado quando a conexão voltar.
        </Alert>
      )}
      {pendentes > 0 && (
        <Badge color="yellow" variant="light" size="lg">
          {pendentes} {pendentes === 1 ? 'ação esperando' : 'ações esperando'} para enviar
        </Badge>
      )}
      <GradeDeFavoritos produtos={produtos} favoritos={favoritos} aoAlternar={alternar} />
    </Stack>
  )
}
