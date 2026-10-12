import { useState } from 'react'
import { api } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { FormularioDeCadastro, type NovoProduto } from './FormularioDeCadastro'

export function ErroGenerico() {
  const [aviso, setAviso] = useState<{ cor: string; texto: string }>()

  async function enviar(produto: NovoProduto) {
    setAviso(undefined)
    try {
      await api('/novos-produtos-erro-generico', { method: 'POST', corpo: produto })
      setAviso({ cor: 'green', texto: `“${produto.nome}” cadastrado!` })
      monitor.tela('produto cadastrado')
    } catch {
      // A API respondeu 500 {"erro":"invalid"}: o front não tem mais nada para mostrar.
      setAviso({ cor: 'red', texto: 'Algo deu errado.' })
      monitor.tela('“Algo deu errado”')
    }
  }

  return <FormularioDeCadastro aoEnviar={enviar} aviso={aviso} erros={{}} />
}
