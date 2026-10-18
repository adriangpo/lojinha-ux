-- Tema "Feedback de sucesso". Sem usuários na lojinha: o carrinho é um só.
CREATE TABLE carrinho (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER NOT NULL REFERENCES produtos (id),
  adicionado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
