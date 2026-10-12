import { randomUUID } from 'node:crypto'
import pg from 'pg'
import { emitir, idDaRequisicaoAtual } from './monitor'

export const URL_DO_BANCO = process.env.DATABASE_URL ?? 'postgres://lojinha:lojinha@localhost:5433/lojinha'

const pool = new pg.Pool({ connectionString: URL_DO_BANCO })

// Executa uma consulta e avisa o monitor (faixa "banco").
export async function sql<T>(texto: string, parametros: unknown[] = []): Promise<T[]> {
  const id = randomUUID()
  emitir({
    tipo: 'inicio',
    id,
    pai: idDaRequisicaoAtual(),
    faixa: 'banco',
    rotulo: resumir(texto),
    em: Date.now(),
    requisicao: { corpo: parametros.length ? `${texto}

-- parâmetros: ${JSON.stringify(parametros)}` : texto },
  })

  try {
    const resultado = await pool.query(texto, parametros)
    emitir({ tipo: 'fim', id, resultado: 'ok', detalhe: `${resultado.rowCount ?? 0} linhas`, em: Date.now() })
    return resultado.rows
  } catch (erro) {
    emitir({ tipo: 'fim', id, resultado: 'erro', em: Date.now() })
    throw erro
  }
}

// "SELECT id, nome FROM produtos WHERE ..." → "SELECT produtos"
function resumir(texto: string) {
  const comando = texto.trim().split(/\s+/)[0].toUpperCase()
  const tabela = texto.match(/\b(?:FROM|INTO|UPDATE)\s+(\w+)/i)?.[1]
  return tabela ? `${comando} ${tabela}` : comando
}
