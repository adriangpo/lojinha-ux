-- Tema "Upload com progresso e tempo real".
-- O worker grava o progresso aqui; o gatilho avisa a API pelo canal "uploads".
CREATE TABLE uploads (
  id SERIAL PRIMARY KEY,
  nome_do_arquivo TEXT NOT NULL,
  tamanho_em_bytes BIGINT NOT NULL,
  progresso INTEGER NOT NULL DEFAULT 0,
  etapa TEXT NOT NULL DEFAULT 'Na fila'
);

-- A cada UPDATE, o Postgres manda um NOTIFY com o estado novo da linha.
-- Quem fez LISTEN no canal "uploads" recebe na hora.
CREATE FUNCTION avisar_progresso_do_upload() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'uploads',
    json_build_object('id', NEW.id, 'progresso', NEW.progresso, 'etapa', NEW.etapa)::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER progresso_do_upload
AFTER UPDATE ON uploads
FOR EACH ROW EXECUTE FUNCTION avisar_progresso_do_upload();
