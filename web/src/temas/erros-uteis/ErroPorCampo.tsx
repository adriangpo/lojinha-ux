import { useState } from 'react'
import { api, ErroDaApi } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { FormularioDeCadastro, type NovoProduto } from './FormularioDeCadastro'

// O front decide o texto a partir do code: dá para mudar a frase (ou traduzir) sem mexer na API.
const MENSAGENS: Record<string, string> = {
  PRODUCT_NAME_REQUIRED: 'Informe o nome do produto',
  PRODUCT_NAME_TAKEN: 'Já existe um produto com esse nome. Que tal um nome diferente?',
  PRODUCT_CATEGORY_INVALID: 'Escolha uma das categorias',
  PRODUCT_PRICE_INVALID: 'Informe um preço maior que zero',
}

export function ErroPorCampo() {
  const [aviso, setAviso] = useState<{ cor: string; texto: string }>()
  const [erros, setErros] = useState<Record<string, string>>({})

  async function enviar(produto: NovoProduto) {
    setAviso(undefined)
    setErros({})
    try {
      await api('/novos-produtos', { method: 'POST', corpo: produto })
      setAviso({ cor: 'green', texto: `“${produto.nome}” cadastrado!` })
      monitor.tela('produto cadastrado')
    } catch (erro) {
      if (erro instanceof ErroDaApi && erro.erros) {
        // 422 ou 409 com { errors: [{ code, message, field }] }: cada mensagem vai para embaixo do seu campo.
        // Code que o front ainda não conhece? Usa a mensagem que veio da API.
        const porCampo: Record<string, string> = {}
        for (const { code, message, field } of erro.erros) porCampo[field] = MENSAGENS[code] ?? message
        setErros(porCampo)
        monitor.tela(`erro embaixo de: ${Object.keys(porCampo).join(', ')}`)
      } else {
        // Outro problema (rede, 503...): mostra a mensagem que a API mandou.
        setAviso({ cor: 'red', texto: erro instanceof Error ? erro.message : 'Erro inesperado' })
        monitor.tela('aviso com a mensagem da API')
      }
    }
  }

  return <FormularioDeCadastro aoEnviar={enviar} aviso={aviso} erros={erros} />
}
