-- Tema N+1: a página do produto mostra o vendedor e os comentários.
CREATE TABLE vendedores (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL
);

INSERT INTO vendedores (nome, cidade) VALUES
  ('Loja do Zé', 'Recife'),
  ('Tech Center', 'São Paulo'),
  ('Casa & Cia', 'Curitiba'),
  ('Esporte Total', 'Belo Horizonte'),
  ('Game Over Store', 'Porto Alegre');

ALTER TABLE produtos ADD COLUMN vendedor_id INTEGER REFERENCES vendedores(id);
UPDATE produtos SET vendedor_id = id % 5 + 1;

CREATE TABLE comentarios (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER NOT NULL REFERENCES produtos(id),
  autor TEXT NOT NULL,
  texto TEXT NOT NULL,
  nota INTEGER NOT NULL
);

-- 12 comentários por produto.
INSERT INTO comentarios (produto_id, autor, texto, nota)
SELECT
  p.id,
  (ARRAY['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabi', 'Heitor', 'Iris', 'João', 'Kátia', 'Lucas'])[n],
  (ARRAY['Chegou rápido.', 'Muito bom pelo preço.', 'Esperava mais.', 'Recomendo!', 'Bem embalado.',
         'Qualidade ok.', 'Comprei de novo.', 'Veio diferente da foto.', 'Excelente.', 'Atendeu ao que eu precisava.',
         'Vendedor atencioso.', 'Nota 10.'])[n],
  (ARRAY[5, 4, 3, 5, 4, 3, 5, 2, 5, 4, 5, 5])[n]
FROM produtos p
CROSS JOIN generate_series(1, 12) AS n;
