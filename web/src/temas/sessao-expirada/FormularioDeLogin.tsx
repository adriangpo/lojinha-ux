import { Alert, Button, PasswordInput, Stack, TextInput } from '@mantine/core'
import { useState, type FormEvent } from 'react'
import { ErroDaApi } from '../../lib/api'
import { entrar } from './sessao'

// Login de mentira: qualquer e-mail e senha servem. Já vem preenchido para agilizar a demo.
export function FormularioDeLogin({ aoEntrar }: { aoEntrar: () => void }) {
  const [erro, setErro] = useState<string>()
  const [entrando, setEntrando] = useState(false)

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const dados = new FormData(evento.currentTarget)
    setEntrando(true)
    try {
      await entrar(String(dados.get('email')), String(dados.get('senha')))
      aoEntrar()
    } catch (falha) {
      setErro(falha instanceof ErroDaApi ? falha.message : 'Não foi possível entrar.')
    } finally {
      setEntrando(false)
    }
  }

  return (
    <form onSubmit={enviar}>
      <Stack maw={360}>
        <TextInput label="E-mail" name="email" defaultValue="ana@lojinha.com" />
        <PasswordInput label="Senha" name="senha" defaultValue="123456" />
        {erro && <Alert color="red">{erro}</Alert>}
        <Button type="submit" loading={entrando}>
          Entrar
        </Button>
      </Stack>
    </form>
  )
}
