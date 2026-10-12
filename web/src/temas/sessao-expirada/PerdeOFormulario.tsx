import { Alert, Loader, Stack, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { ErroDaApi } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { FormularioDeLogin } from './FormularioDeLogin'
import { FormularioLongo } from './FormularioLongo'
import { salvarCadastro, verificarSessao, type Cadastro } from './sessao'

type Mensagem = { cor: string; texto: string }

export function PerdeOFormulario() {
  const [logado, setLogado] = useState<boolean>()
  const [mensagem, setMensagem] = useState<Mensagem>()
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    verificarSessao().then(
      () => setLogado(true),
      () => setLogado(false),
    )
  }, [])

  async function enviar(cadastro: Cadastro) {
    setEnviando(true)
    try {
      const { mensagem } = await salvarCadastro(cadastro)
      setMensagem({ cor: 'green', texto: mensagem })
      monitor.tela('cadastro salvo')
    } catch (erro) {
      // 401: "manda para a tela de login". O formulário sai da tela, e o que foi digitado vai junto.
      if (erro instanceof ErroDaApi && erro.status === 401) {
        setLogado(false)
        monitor.tela('tela de login: formulário apagado')
      } else {
        setMensagem({ cor: 'red', texto: 'Não foi possível salvar.' })
      }
    } finally {
      setEnviando(false)
    }
  }

  if (logado === undefined) return <Loader />

  if (!logado) {
    return (
      <Stack>
        <Title order={4}>Entre para continuar</Title>
        <FormularioDeLogin aoEntrar={() => setLogado(true)} />
      </Stack>
    )
  }

  return (
    <Stack>
      {mensagem && <Alert color={mensagem.cor}>{mensagem.texto}</Alert>}
      <FormularioLongo aoEnviar={enviar} enviando={enviando} />
    </Stack>
  )
}
