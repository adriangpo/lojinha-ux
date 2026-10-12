-- Produtos cadastrados nas demos de Formulários e Erros úteis.
-- Tabela separada de propósito: os cadastros feitos ao vivo não aparecem
-- na lista de produtos que as outras demos usam.
CREATE TABLE novos_produtos (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  preco_centavos INTEGER NOT NULL
);
