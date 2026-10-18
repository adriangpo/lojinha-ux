import { Router } from 'express'
import { sql } from '../banco'

type Cadastro = {
  nome: string
  categoria: string
  precoCentavos: number
}

const CATEGORIAS = ['Eletrônicos', 'Livros', 'Casa', 'Esporte', 'Games']

export const rotasDeNovosProdutos = Router()

// Formato de erro do Agiliza Aí: { errors: [{ code, message, field }] }.
// O code é único e estável: o front decide o texto a partir dele (dá até para usar como chave de tradução).
// O field é o nome do campo no corpo do pedido. Lista vazia = tudo certo.
type ErroDeCampo = { code: string; message: string; field: string }

function validar({ nome, categoria, precoCentavos }: Cadastro) {
  const erros: ErroDeCampo[] = []

  if (typeof nome !== 'string' || nome.trim() === '') {
    erros.push({ code: 'PRODUCT_NAME_REQUIRED', message: 'Informe o nome do produto', field: 'nome' })
  }
  if (!CATEGORIAS.includes(categoria)) {
    erros.push({ code: 'PRODUCT_CATEGORY_INVALID', message: 'Escolha uma das categorias', field: 'categoria' })
  }
  if (!Number.isInteger(precoCentavos) || precoCentavos <= 0) {
    erros.push({ code: 'PRODUCT_PRICE_INVALID', message: 'Informe um preço maior que zero', field: 'precoCentavos' })
  }

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
  if (validar(req.body).length > 0 || (await nomeEmUso(req.body.nome))) {
    res.status(500).json({ erro: 'invalid' })
    return
  }

  res.status(201).json(await salvar(req.body))
})

// Versão boa: o status diz o tipo do problema e cada erro tem code, mensagem e campo.
rotasDeNovosProdutos.post('/novos-produtos', async (req, res) => {
  // 422: entendi o pedido, mas os dados não passam.
  const erros = validar(req.body)
  if (erros.length > 0) {
    res.status(422).json({ errors: erros })
    return
  }

  // 409: os dados estão certos, mas batem com o que já existe.
  // Isso só o servidor sabe: o front não tem a lista de todos os produtos.
  if (await nomeEmUso(req.body.nome)) {
    res.status(409).json({
      errors: [{ code: 'PRODUCT_NAME_TAKEN', message: 'Já existe um produto com esse nome', field: 'nome' }],
    })
    return
  }

  res.status(201).json(await salvar(req.body))
})
