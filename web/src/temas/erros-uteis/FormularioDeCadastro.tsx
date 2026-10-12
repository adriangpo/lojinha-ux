import { Alert, Button, NumberInput, Select, Stack, TextInput } from '@mantine/core'
import { useState, type FormEvent } from 'react'
import { monitor } from '../../lib/monitor'
import { CATEGORIAS } from '../../lib/produtos'

export type NovoProduto = {
  nome: string
  categoria: string | null
  precoCentavos: number
}

type Props = {
  aoEnviar: (produto: NovoProduto) => Promise<void>
  aviso?: { cor: string; texto: string }
  erros: Record<string, string>
}

// O mesmo formulário nas duas versões: o que muda é a resposta da API.
// Sem validação no front de propósito, para toda a validação vir do servidor.
export function FormularioDeCadastro({ aoEnviar, aviso, erros }: Props) {
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [preco, setPreco] = useState<string | number>('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    monitor.marca('clicou em Cadastrar')
    setEnviando(true)
    await aoEnviar({ nome, categoria, precoCentavos: Math.round(Number(preco) * 100) })
    setEnviando(false)
  }

  return (
    <form onSubmit={enviar}>
      <Stack maw={420}>
        {aviso && <Alert color={aviso.cor}>{aviso.texto}</Alert>}

        <TextInput label="Nome" value={nome} onChange={(e) => setNome(e.currentTarget.value)} error={erros.nome} />
        <Select label="Categoria" data={CATEGORIAS} value={categoria} onChange={setCategoria} error={erros.categoria} />
        <NumberInput
          label="Preço"
          prefix="R$ "
          decimalSeparator=","
          thousandSeparator="."
          decimalScale={2}
          value={preco}
          onChange={setPreco}
          error={erros.preco}
        />

        <Button type="submit" loading={enviando}>
          Cadastrar
        </Button>
      </Stack>
    </form>
  )
}
