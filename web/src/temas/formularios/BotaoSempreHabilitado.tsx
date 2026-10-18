import { Alert, Button, List, NumberInput, Select, Stack, TextInput } from '@mantine/core'
import { useState, type FormEvent } from 'react'
import { api } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { CATEGORIAS } from '../../lib/produtos'

type Campo = 'nome' | 'categoria' | 'preco'

const ROTULOS: Record<Campo, string> = { nome: 'Nome', categoria: 'Categoria', preco: 'Preço' }

// A outra corrente (GOV.UK): o botão nunca parece desabilitado. Um botão cinza não explica
// o que falta; clicando, o usuário descobre na hora, sem esperar o servidor.
export function BotaoSempreHabilitado() {
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [preco, setPreco] = useState<string | number>('')
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<{ cor: string; texto: string }>()

  const erros: Partial<Record<Campo, string>> = {}
  if (nome.trim() === '') erros.nome = 'Informe o nome do produto'
  if (!categoria) erros.categoria = 'Escolha uma categoria'
  if (typeof preco !== 'number' || preco <= 0) erros.preco = 'Informe um preço maior que zero'

  const pendentes = Object.keys(erros) as Campo[]
  // Os erros só aparecem depois do primeiro clique: antes disso, o usuário ainda está preenchendo.
  const erroDo = (campo: Campo) => (tentouEnviar ? erros[campo] : undefined)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    monitor.marca('clicou em Cadastrar')
    if (enviando) return

    if (pendentes.length > 0) {
      setTentouEnviar(true)
      monitor.tela('resumo dos erros no topo + campos marcados')
      return
    }

    setEnviando(true)
    setAviso(undefined)
    try {
      await api('/novos-produtos', {
        method: 'POST',
        corpo: { nome, categoria, precoCentavos: Math.round(Number(preco) * 100) },
      })
      setAviso({ cor: 'green', texto: `“${nome}” cadastrado!` })
      setNome('')
      setCategoria(null)
      setPreco('')
      setTentouEnviar(false)
      monitor.tela('produto cadastrado')
    } catch {
      setAviso({ cor: 'red', texto: 'Não foi possível cadastrar. Seus dados continuam aí: tente de novo.' })
      monitor.tela('aviso de erro, dados mantidos')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar}>
      <Stack maw={420}>
        {aviso && <Alert color={aviso.cor}>{aviso.texto}</Alert>}

        {/* Resumo no topo: o usuário vê tudo o que falta de uma vez, sem caçar campo por campo. */}
        {tentouEnviar && pendentes.length > 0 && (
          <Alert color="red" title="Falta preencher:">
            <List size="sm">
              {pendentes.map((campo) => (
                <List.Item key={campo}>{ROTULOS[campo]}</List.Item>
              ))}
            </List>
          </Alert>
        )}

        <TextInput label="Nome" withAsterisk value={nome} onChange={(e) => setNome(e.currentTarget.value)} error={erroDo('nome')} />
        <Select label="Categoria" withAsterisk data={CATEGORIAS} value={categoria} onChange={setCategoria} error={erroDo('categoria')} />
        <NumberInput
          label="Preço"
          withAsterisk
          prefix="R$ "
          decimalSeparator=","
          thousandSeparator="."
          decimalScale={2}
          value={preco}
          onChange={setPreco}
          error={erroDo('preco')}
        />

        {/* Durante o envio, um segundo clique não faz nada (o if (enviando) lá em cima). */}
        <Button type="submit">{enviando ? 'Enviando…' : 'Cadastrar'}</Button>
      </Stack>
    </form>
  )
}
