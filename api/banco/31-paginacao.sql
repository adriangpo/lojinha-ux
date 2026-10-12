-- Tema Paginação: um feed em que o mais novo aparece primeiro.
CREATE TABLE publicacoes (
  id SERIAL PRIMARY KEY,
  texto TEXT NOT NULL
);

INSERT INTO publicacoes (texto)
SELECT 'Publicação ' || n FROM generate_series(1, 100) AS n;
