import { Loader } from '@mantine/core'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { TelaDoProduto, type Comentario, type Vendedor } from './TelaDoProduto'

type Tela = {
  id: number
  nome: string
  categoria: string
  precoCentavos: number
  vendedor: Vendedor
  comentarios: Comentario[]
}

const ID_DO_PRODUTO = 7

// A API entrega a tela pronta: uma requisição só.
export function UmEndpoint() {
  const [tela, setTela] = useState<Tela>()

  useEffect(() => {
    api<Tela>(`/telas/produto/${ID_DO_PRODUTO}`).then(setTela)
  }, [])

  return tela ? <TelaDoProduto {...tela} /> : <Loader />
}
