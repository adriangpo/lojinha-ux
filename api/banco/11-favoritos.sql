-- Demo de Optimistic UI. Sem usuários na lojinha: um favorito é só o id do produto.
CREATE TABLE favoritos (
  produto_id INTEGER PRIMARY KEY REFERENCES produtos (id)
);
