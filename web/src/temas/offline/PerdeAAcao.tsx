import { Alert, Stack } from '@mantine/core'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { buscarProdutos, type Produto } from '../../lib/produtos'
import { GradeDeFavoritos } from './GradeDeFavoritos'

export function PerdeAAcao() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [favoritos, setFavoritos] = useState<number[]>([])
  const [aviso, setAviso] = useState<string>()

  useEffect(() => {
    buscarProdutos({ categoria: 'Livros' }).then((dados) => setProdutos(dados.slice(0, 6)))
    api<number[]>('/favoritos').then(setFavoritos)
  }, [])

  async function alternar(produto: Produto) {
    monitor.marca(`clicou no coração: ${produto.nome}`)
    const favoritar = !favoritos.includes(produto.id)
    setAviso(undefined)

    try {
      await api(`/favoritos/${produto.id}`, { method: favoritar ? 'PUT' : 'DELETE' })
      setFavoritos((atuais) => (favoritar ? [...atuais, produto.id] : atuais.filter((id) => id !== produto.id)))
      monitor.tela(favoritar ? 'coração vermelho' : 'coração vazio')
    } catch {
      // Sem conexão, o fetch falha e a ação some. O usuário não sabe por quê
      // e precisa lembrar de fazer tudo de novo quando a conexão voltar.
      setAviso('Algo deu errado.')
      monitor.tela('“Algo deu errado”, ação perdida')
    }
  }

  return (
    <Stack>
      {aviso && <Alert color="red">{aviso}</Alert>}
      <GradeDeFavoritos produtos={produtos} favoritos={favoritos} aoAlternar={alternar} />
    </Stack>
  )
}
