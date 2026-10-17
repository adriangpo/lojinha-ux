import { Router } from 'express'
import { sql } from '../banco'

type Cadastro = {
  nome: string
  categoria: string
  precoCentavos: number
}

const CATEGORIAS = ['Eletrônicos', 'Livros', 'Casa', 'Esporte', 'Games']

export const rotasDeNovosProdutos = Router()

// Devolve um erro por campo: { nome: 'Já existe um produto com esse nome' }.
// Vazio = tudo certo.
async function validar({ nome, categoria, precoCentavos }: Cadastro) {
  const erros: Record<string, string> = {}

  if (typeof nome !== 'string' || nome.trim() === '') {
    erros.nome = 'Informe o nome do produto'
  } else if (await nomeEmUso(nome)) {
    // Isso só o servidor sabe: o front não tem a lista de todos os produtos.
    erros.nome = `Já existe um produto chamado “${nome.trim()}”`
  }

  if (!CATEGORIAS.includes(categoria)) erros.categoria = 'Escolha uma das categorias'

  if (!Number.isInteger(precoCentavos) || precoCentavos <= 0) erros.preco = 'Informe um preço maior que zero'

  return erros
}

async function nomeEmUso(nome: string) {
  const encontrados = await sql(
    `SELECT 1 FROM produtos WHERE lower(nome) = lower($1)
     UNION ALL
     SELECT 1 FROM novos_produtos WHERE lower(nome) = lower($1)`,
    [nome.trim()],
  )
  return encontrados.length > 0
}

async function salvar({ nome, categoria, precoCentavos }: Cadastro) {
  const [salvo] = await sql<{ id: number }>(
    'INSERT INTO novos_produtos (nome, categoria, preco_centavos) VALUES ($1, $2, $3) RETURNING id',
    [nome.trim(), categoria, precoCentavos],
  )
  return salvo
}

// Versão ruim: a API sabe exatamente o que está errado, mas joga a informação fora.
// Status 500 diz "o servidor quebrou" - e não quebrou, o dado é que veio errado.
rotasDeNovosProdutos.post('/novos-produtos-erro-generico', async (req, res) => {
  const erros = await validar(req.body)
  if (Object.keys(erros).length > 0) {
    res.status(500).json({ erro: 'invalid' })
    return
  }

  res.status(201).json(await salvar(req.body))
})

// Versão boa: 422 (entendi o pedido, mas os dados não passam) e um erro por campo,
// para o front colocar cada mensagem embaixo do campo certo.
rotasDeNovosProdutos.post('/novos-produtos', async (req, res) => {
  const erros = await validar(req.body)
  if (Object.keys(erros).length > 0) {
    res.status(422).json({ erro: 'Confira os campos destacados', campos: erros })
    return
  }

  res.status(201).json(await salvar(req.body))
})
