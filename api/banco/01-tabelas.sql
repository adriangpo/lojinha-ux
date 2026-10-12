-- Preço em centavos: inteiro não tem erro de arredondamento.
CREATE TABLE produtos (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  preco_centavos INTEGER NOT NULL
);
