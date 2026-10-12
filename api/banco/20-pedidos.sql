-- Tema "Clique duplo e idempotência".
-- UNIQUE na chave: o próprio banco garante um pedido por chave,
-- mesmo que duas requests cheguem ao mesmo tempo.
CREATE TABLE pedidos (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER NOT NULL REFERENCES produtos (id),
  chave_de_idempotencia TEXT UNIQUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
