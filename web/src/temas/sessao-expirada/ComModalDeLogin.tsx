import { Alert, Modal, Stack } from '@mantine/core'
import { useEffect, useState } from 'react'
import { ErroDaApi } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { FormularioDeLogin } from './FormularioDeLogin'
import { FormularioLongo } from './FormularioLongo'
import { salvarCadastro, verificarSessao, type Cadastro } from './sessao'

type Mensagem = { cor: string; texto: string }

export function ComModalDeLogin() {
  const [pedindoLogin, setPedindoLogin] = useState(false)
  // O envio que falhou por sessão expirada, guardado para refazer depois do login.
  const [pendente, setPendente] = useState<Cadastro>()
  const [mensagem, setMensagem] = useState<Mensagem>()
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    verificarSessao().catch(() => setPedindoLogin(true))
  }, [])

  async function enviar(cadastro: Cadastro) {
    setEnviando(true)
    try {
      const { mensagem } = await salvarCadastro(cadastro)
      setMensagem({ cor: 'green', texto: mensagem })
      monitor.tela('cadastro salvo')
    } catch (erro) {
      // 401: pede login por cima. O formulário continua na tela, com tudo o que foi digitado.
      if (erro instanceof ErroDaApi && erro.status === 401) {
        setPendente(cadastro)
        setPedindoLogin(true)
        monitor.tela('modal de login; formulário continua preenchido')
      } else {
        setMensagem({ cor: 'red', texto: 'Não foi possível salvar.' })
      }
    } finally {
      setEnviando(false)
    }
  }

  async function aoEntrar() {
    setPedindoLogin(false)
    // Refaz o envio que tinha falhado: o usuário não precisa clicar em "Salvar" de novo.
    if (pendente) {
      setPendente(undefined)
      monitor.tela('modal fechado; reenviando o cadastro')
      await enviar(pendente)
    }
  }

  return (
    <Stack>
      <Modal opened={pedindoLogin} onClose={() => setPedindoLogin(false)} title="Sua sessão expirou. Entre de novo para continuar.">
        <FormularioDeLogin aoEntrar={aoEntrar} />
      </Modal>
      {mensagem && <Alert color={mensagem.cor}>{mensagem.texto}</Alert>}
      <FormularioLongo aoEnviar={enviar} enviando={enviando} />
    </Stack>
  )
}
