import { Alert, Button, Group, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core'
import { useState, type FormEvent } from 'react'
import { api } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { CATEGORIAS } from '../../lib/produtos'

type Campo = 'nome' | 'categoria' | 'preco'

const ROTULOS: Record<Campo, string> = { nome: 'Nome', categoria: 'Categoria', preco: 'Preço' }

export function CadastroComValidacao() {
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [preco, setPreco] = useState<string | number>('')
  // Campos por onde o usuário já passou. Só eles mostram erro: ninguém quer bronca antes de começar.
  const [tocados, setTocados] = useState<Campo[]>([])
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<{ cor: string; texto: string }>()

  // Os erros saem dos valores a cada render: não precisam de estado próprio.
  const erros: Partial<Record<Campo, string>> = {}
  if (nome.trim() === '') erros.nome = 'Informe o nome do produto'
  if (!categoria) erros.categoria = 'Escolha uma categoria'
  if (typeof preco !== 'number' || preco <= 0) erros.preco = 'Informe um preço maior que zero'

  const pendentes = Object.keys(erros) as Campo[]
  const bloqueado = pendentes.length > 0 || enviando

  const sair = (campo: Campo) => setTocados((atuais) => [...atuais, campo])
  const erroDo = (campo: Campo) => (tocados.includes(campo) ? erros[campo] : undefined)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    monitor.marca('clicou em Cadastrar')

    // Durante o envio, um segundo clique não faz nada (nada de cadastro duplicado).
    if (enviando) return

    // Clicou com campo faltando: em vez de ignorar o clique, mostra o que falta.
    if (pendentes.length > 0) {
      setTocados(['nome', 'categoria', 'preco'])
      monitor.tela('campos pendentes destacados')
      return
    }

    setEnviando(true)
    monitor.tela('botão “Enviando…”')
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
      setTocados([])
      monitor.tela('produto cadastrado')
    } catch {
      // Nada é apagado: o usuário tenta de novo sem redigitar.
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

        <TextInput
          label="Nome"
          withAsterisk
          value={nome}
          onChange={(e) => setNome(e.currentTarget.value)}
          onBlur={() => sair('nome')}
          error={erroDo('nome')}
        />
        <Select
          label="Categoria"
          withAsterisk
          data={CATEGORIAS}
          value={categoria}
          onChange={setCategoria}
          onBlur={() => sair('categoria')}
          error={erroDo('categoria')}
        />
        <NumberInput
          label="Preço"
          withAsterisk
          prefix="R$ "
          decimalSeparator=","
          thousandSeparator="."
          decimalScale={2}
          value={preco}
          onChange={setPreco}
          onBlur={() => sair('preco')}
          error={erroDo('preco')}
        />

        <Group>
          {/* aria-disabled em vez de disabled: o botão continua no Tab e o clique ainda explica o que falta. */}
          <Button type="submit" aria-disabled={bloqueado} data-disabled={bloqueado || undefined}>
            {enviando ? 'Enviando…' : 'Cadastrar'}
          </Button>
          {pendentes.length > 0 && (
            <Text size="sm" c="dimmed">
              Falta preencher: {pendentes.map((campo) => ROTULOS[campo]).join(', ')}
            </Text>
          )}
        </Group>
      </Stack>
    </form>
  )
}
