import { useState } from 'react'
import { api, ErroDaApi } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { FormularioDeCadastro, type NovoProduto } from './FormularioDeCadastro'

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
      if (erro instanceof ErroDaApi && erro.campos) {
        // 422 com erro por campo: cada mensagem vai para embaixo do seu campo.
        setErros(erro.campos)
        monitor.tela(`erro embaixo de: ${Object.keys(erro.campos).join(', ')}`)
      } else {
        // Outro problema (rede, 503...): mostra a mensagem que a API mandou.
        setAviso({ cor: 'red', texto: erro instanceof Error ? erro.message : 'Erro inesperado' })
        monitor.tela('aviso com a mensagem da API')
      }
    }
  }

  return <FormularioDeCadastro aoEnviar={enviar} aviso={aviso} erros={erros} />
}
