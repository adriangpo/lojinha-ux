import { Alert, Button, Stack, Text } from '@mantine/core'
import { useState } from 'react'
import { ListaDeProdutos } from '../../componentes/ListaDeProdutos'
import { ErroDaApi } from '../../lib/api'
import { monitor } from '../../lib/monitor'
import { buscarProdutos, type Produto } from '../../lib/produtos'

// Quanto esperar depois da 1ª, 2ª e 3ª falha: o dobro a cada vez, e depois desiste.
// Em produção, some um pouco de aleatoriedade (jitter) para os clientes não voltarem todos juntos.
const ESPERAS = [1000, 2000, 4000]

// Retry só é seguro em operação idempotente: buscar produtos pode repetir à vontade;
// um POST /transferencias sem chave de idempotência poderia enviar o Pix duas vezes.
export function ComBackoff() {
  const [produtos, setProdutos] = useState<Produto[]>()
  const [erro, setErro] = useState<string>()
  const [historico, setHistorico] = useState<string[]>([])
  const [carregando, setCarregando] = useState(false)

  const anotar = (linha: string) => setHistorico((atual) => [...atual, linha])

  async function carregar() {
    monitor.marca('clicou em Carregar')
    setProdutos(undefined)
    setErro(undefined)
    setHistorico([])
    setCarregando(true)

    for (let tentativa = 1; ; tentativa++) {
      try {
        setProdutos(await buscarProdutos({ categoria: 'Livros' }))
        monitor.tela('produtos na tela')
        anotar(`Tentativa ${tentativa}: deu certo`)
        break
      } catch (falha) {
        const espera = ESPERAS[tentativa - 1]
        // Erro 4xx (pedido inválido, sem permissão) não melhora tentando de novo.
        const naoAdiantaRepetir = falha instanceof ErroDaApi && falha.status < 500
        if (espera === undefined || naoAdiantaRepetir) {
          anotar(`Tentativa ${tentativa}: falhou. Desistindo.`)
          setErro('Não foi possível carregar os produtos. Tente de novo daqui a pouco.')
          monitor.tela(`erro na tela, depois de ${tentativa} tentativas`)
          break
        }
        anotar(`Tentativa ${tentativa}: falhou. Tentando de novo em ${espera / 1000}s…`)
        // Igual a um setTimeout, mas aparece no monitor como uma barra de espera.
        await monitor.esperar(`backoff ${espera / 1000}s`, espera)
      }
    }

    setCarregando(false)
  }

  return (
    <Stack>
      <Button onClick={carregar} loading={carregando} w="fit-content">
        Carregar produtos
      </Button>
      {historico.map((linha) => (
        <Text key={linha} size="sm" c={linha.includes('certo') ? 'green.8' : 'red.7'}>
          {linha}
        </Text>
      ))}
      {erro && <Alert color="red">{erro}</Alert>}
      {produtos && <ListaDeProdutos produtos={produtos} />}
    </Stack>
  )
}
