-- Tema "Clique duplo e idempotência": um Pix.
CREATE TABLE transferencias (
  id SERIAL PRIMARY KEY,
  para TEXT NOT NULL,
  valor_centavos INTEGER NOT NULL CHECK (valor_centavos > 0),
  chave_de_idempotencia TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cada chave guarda a primeira tentativa por um tempo (30s na demo; 24h na vida real).
-- PRIMARY KEY na chave: o próprio banco garante uma reserva por chave,
-- mesmo que duas requests cheguem ao mesmo tempo.
CREATE TABLE chaves_de_idempotencia (
  chave TEXT PRIMARY KEY,
  -- Hash de para + valor: a mesma chave com outro Pix é recusada.
  hash_do_corpo TEXT NOT NULL,
  -- 'processando' enquanto o Pix sai; 'concluida' quando já tem resposta para repetir.
  status TEXT NOT NULL DEFAULT 'processando',
  transferencia_id INTEGER REFERENCES transferencias (id) ON DELETE CASCADE,
  expira_em TIMESTAMPTZ NOT NULL
);
