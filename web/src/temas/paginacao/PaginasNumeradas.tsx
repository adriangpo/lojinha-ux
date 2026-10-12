import { Loader, Pagination, Stack } from '@mantine/core'
import { useEffect, useState } from 'react'
import { monitor } from '../../lib/monitor'
import { buscarPorPagina, type Publicacao } from './feed'
import { ListaDoFeed } from './ListaDoFeed'

// Bom quando o usuário quer achar algo e voltar nele: "estava na página 4".
export function PaginasNumeradas() {
  const [pagina, setPagina] = useState(1)
  const [itens, setItens] = useState<Publicacao[]>()
  const [totalDePaginas, setTotalDePaginas] = useState(0)

  useEffect(() => {
    let ativo = true
    buscarPorPagina(pagina).then((resposta) => {
      if (!ativo) return
      setItens(resposta.itens)
      monitor.tela(`página ${pagina}`)
      setTotalDePaginas(resposta.totalDePaginas)
    })
    return () => {
      ativo = false
    }
  }, [pagina])

  return (
    <Stack>
      {itens ? <ListaDoFeed itens={itens} /> : <Loader />}
      <Pagination total={totalDePaginas} value={pagina} onChange={setPagina} />
    </Stack>
  )
}
