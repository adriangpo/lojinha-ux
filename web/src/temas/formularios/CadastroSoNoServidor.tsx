import { Alert, Button, NumberInput, Select, Stack, TextInput } from '@mantine/core'
import { useState, type FormEvent } from 'react'
import { api } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { CATEGORIAS } from '../../lib/produtos'

export function CadastroSoNoServidor() {
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [preco, setPreco] = useState<string | number>('')
  const [aviso, setAviso] = useState<{ cor: string; texto: string }>()

  // Nenhuma checagem antes do clique: o usuário só descobre o problema depois de esperar o servidor.
  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    monitor.marca('clicou em Cadastrar')

    try {
      await api('/novos-produtos', {
        method: 'POST',
        corpo: { nome, categoria, precoCentavos: Math.round(Number(preco) * 100) },
      })
      setAviso({ cor: 'green', texto: 'Produto cadastrado!' })
      monitor.tela('produto cadastrado')
    } catch {
      // A API até diz qual campo está errado, mas a tela joga isso fora.
      setAviso({ cor: 'red', texto: 'Algo deu errado. Tente novamente.' })
      monitor.tela('erro genérico: “Algo deu errado”')
    }

    // Limpa tudo, deu certo ou não: quem errou um campo digita o formulário inteiro de novo.
    setNome('')
    setCategoria(null)
    setPreco('')
    monitor.tela('formulário apagado')
  }

  return (
    <form onSubmit={enviar}>
      <Stack maw={420}>
        {aviso && <Alert color={aviso.cor}>{aviso.texto}</Alert>}

        <TextInput label="Nome" value={nome} onChange={(e) => setNome(e.currentTarget.value)} />
        <Select label="Categoria" data={CATEGORIAS} value={categoria} onChange={setCategoria} />
        <NumberInput
          label="Preço"
          prefix="R$ "
          decimalSeparator=","
          thousandSeparator="."
          decimalScale={2}
          value={preco}
          onChange={setPreco}
        />

        <Button type="submit">Cadastrar</Button>
      </Stack>
    </form>
  )
}
