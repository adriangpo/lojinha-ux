import { Button, Modal, Text } from '@mantine/core'
import { useState } from 'react'
import { monitor } from '../../lib/monitor'
import type { Produto } from '../../lib/produtos'
import { adicionarAoCarrinho } from './carrinho'
import { VitrineDoCarrinho } from './VitrineDoCarrinho'

export function AlertaQueBloqueia() {
  const [adicionado, setAdicionado] = useState<string>()

  async function adicionar(produto: Produto) {
    await adicionarAoCarrinho(produto)
    setAdicionado(produto.nome)
    monitor.tela('alerta na frente de tudo')
  }

  return (
    <>
      <VitrineDoCarrinho aoAdicionar={adicionar} />

      {/* Para a compra para dar uma notícia que o usuário já esperava: só segue depois de clicar em OK. */}
      <Modal
        opened={adicionado !== undefined}
        onClose={() => setAdicionado(undefined)}
        title="Sucesso!"
        centered
        withCloseButton={false}
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <Text mb="md">“{adicionado}” foi adicionado ao carrinho com sucesso.</Text>
        <Button fullWidth onClick={() => setAdicionado(undefined)}>
          OK
        </Button>
      </Modal>
    </>
  )
}
