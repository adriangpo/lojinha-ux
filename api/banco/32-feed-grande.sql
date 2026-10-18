-- Tema Paginação, versão "Sem paginação": com 100 publicações, mandar tudo nem pesa.
-- Com 5.000, o problema aparece: resposta grande, banco lendo tudo e tela demorando para desenhar.
INSERT INTO publicacoes (texto)
SELECT 'Publicação ' || n FROM generate_series(101, 5000) AS n;
