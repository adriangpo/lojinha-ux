import { Alert, Button, NumberInput, Select, Stack, TextInput } from '@mantine/core'
import { useRef, useState, type FormEvent } from 'react'
import { api } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { CATEGORIAS } from '../../lib/produtos'

type Campo = 'nome' | 'categoria' | 'preco'

// Altura de um campo já com a mensagem de erro. Reservar esse espaço evita que o erro
// empurre o que está embaixo bem na hora do clique (e o clique erre o alvo).
const ALTURA_COM_ERRO = 81

// O melhor das duas correntes: o botão parece desabilitado (avisa que falta algo),
// mas o clique ainda funciona e explica o quê. E nenhum erro aparece antes da hora.
export function ErroAoSairDoCampo() {
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [preco, setPreco] = useState<string | number>('')
  // Campos em que o usuário entrou e saiu. Só eles mostram erro: quem ainda não chegou no campo não leva bronca.
  const [tocados, setTocados] = useState<Campo[]>([])
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<{ cor: string; texto: string }>()
  // Para levar o foco até o primeiro campo com erro.
  const refs = {
    nome: useRef<HTMLInputElement>(null),
    categoria: useRef<HTMLInputElement>(null),
    preco: useRef<HTMLInputElement>(null),
  }

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

    // Clicou no botão "desabilitado": não envia, mas mostra todos os erros e leva ao primeiro.
    if (pendentes.length > 0) {
      setTocados(['nome', 'categoria', 'preco'])
      refs[pendentes[0]].current?.focus()
      monitor.tela('erros em todos os campos, foco no primeiro')
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
          ref={refs.nome}
          mih={ALTURA_COM_ERRO}
          label="Nome"
          withAsterisk
          value={nome}
          onChange={(e) => setNome(e.currentTarget.value)}
          onBlur={() => sair('nome')}
          error={erroDo('nome')}
        />
        <Select
          ref={refs.categoria}
          mih={ALTURA_COM_ERRO}
          label="Categoria"
          withAsterisk
          data={CATEGORIAS}
          value={categoria}
          onChange={setCategoria}
          onBlur={() => sair('categoria')}
          error={erroDo('categoria')}
        />
        <NumberInput
          ref={refs.preco}
          mih={ALTURA_COM_ERRO}
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

        {/* aria-disabled em vez de disabled: com disabled, o clique nem chega aqui e não daria para explicar o que falta.
            data-disabled só pinta o botão de cinza. */}
        <Button type="submit" aria-disabled={bloqueado} data-disabled={bloqueado || undefined}>
          {enviando ? 'Enviando…' : 'Cadastrar'}
        </Button>
      </Stack>
    </form>
  )
}
