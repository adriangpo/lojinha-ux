import { Stack } from '@mantine/core'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { CampoDeBusca } from '../../componentes/CampoDeBusca'
import { ListaDeProdutos } from '../../componentes/ListaDeProdutos'
import { SeletorDeCategoria } from '../../componentes/SeletorDeCategoria'
import { monitor } from '../../lib/monitor'
import { buscarProdutos, CATEGORIAS } from '../../lib/produtos'

export function FiltrosNaUrl() {
  // Os filtros moram na URL (?busca=fone&categoria=Livros): sobrevivem ao F5 e vão junto no link.
  const [parametros, setParametros] = useSearchParams()
  const busca = parametros.get('busca') ?? ''
  const categoria = parametros.get('categoria') ?? CATEGORIAS[0]

  // Ao abrir (ou dar F5): os filtros voltam da URL.
  useEffect(() => monitor.tela(`filtros restaurados da URL: “${busca}” em ${categoria}`), [])

  function mudar(nome: string, valor: string) {
    // Recebe os parâmetros atuais e muda só um: o ?versao= da página continua lá.
    setParametros(
      (atuais) => {
        if (valor) atuais.set(nome, valor)
        else atuais.delete(nome)
        return atuais
      },
      // Substitui a entrada do histórico: sem isso, o Voltar desfaria uma tecla por vez.
      { replace: true },
    )
  }

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos', 'filtros', busca, categoria],
    queryFn: ({ signal }) => buscarProdutos({ busca, categoria }, signal),
    // Mantém a lista anterior na tela enquanto a nova chega.
    placeholderData: keepPreviousData,
  })

  return (
    <Stack>
      <CampoDeBusca valor={busca} aoMudar={(valor) => mudar('busca', valor)} />
      <SeletorDeCategoria valor={categoria} aoMudar={(valor) => mudar('categoria', valor)} />
      <ListaDeProdutos produtos={produtos} />
    </Stack>
  )
}
