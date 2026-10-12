import { Button, SimpleGrid, Stack, Textarea, TextInput } from '@mantine/core'
import { monitor } from '../../lib/monitor'
import type { Cadastro } from './sessao'

type Props = {
  aoEnviar: (cadastro: Cadastro) => void
  enviando: boolean
}

// Campos não controlados: quem guarda o que foi digitado é o próprio DOM.
// Enquanto o formulário estiver na tela, nada se perde; se ele sair da tela, perde tudo.
export function FormularioLongo({ aoEnviar, enviando }: Props) {
  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault()
        monitor.marca('clicou em Salvar')
        aoEnviar(Object.fromEntries(new FormData(evento.currentTarget)) as Cadastro)
      }}
    >
      <Stack maw={640}>
        <SimpleGrid cols={2}>
          <TextInput label="Nome completo" name="nome" />
          <TextInput label="E-mail" name="email" />
          <TextInput label="Telefone" name="telefone" />
          <TextInput label="CPF" name="cpf" />
          <TextInput label="CEP" name="cep" />
          <TextInput label="Endereço" name="endereco" />
          <TextInput label="Número" name="numero" />
          <TextInput label="Complemento" name="complemento" />
          <TextInput label="Cidade" name="cidade" />
          <TextInput label="Estado" name="estado" />
        </SimpleGrid>
        <Textarea label="Conte um pouco sobre a sua loja" name="sobre" autosize minRows={3} />
        <Button type="submit" w="fit-content" loading={enviando}>
          Salvar cadastro
        </Button>
      </Stack>
    </form>
  )
}
