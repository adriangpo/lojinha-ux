import { Loader } from '@mantine/core'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { TelaDoProduto, type Comentario, type Vendedor } from './TelaDoProduto'

type Produto = { id: number; nome: string; categoria: string; precoCentavos: number; vendedorId: number }
type Tela = Produto & { vendedor: Vendedor; comentarios: Comentario[] }

const ID_DO_PRODUTO = 7

// A tela monta a página juntando peças de vários endpoints: 1 + 1 + 1 + 12 requisições.
async function carregarTela(): Promise<Tela> {
  const produto = await api<Produto>(`/produtos/${ID_DO_PRODUTO}`)

  // Só dá para pedir o vendedor depois de saber quem ele é.
  const [vendedor, idsDosComentarios] = await Promise.all([
    api<Vendedor>(`/vendedores/${produto.vendedorId}`),
    api<number[]>(`/produtos/${ID_DO_PRODUTO}/comentarios`),
  ])

  // E uma requisição para cada comentário: é o "N" do N+1.
  const comentarios = await Promise.all(idsDosComentarios.map((id) => api<Comentario>(`/comentarios/${id}`)))

  return { ...produto, vendedor, comentarios }
}

export function VariasRequisicoes() {
  const [tela, setTela] = useState<Tela>()

  useEffect(() => {
    carregarTela().then(setTela)
  }, [])

  return tela ? <TelaDoProduto {...tela} /> : <Loader />
}
