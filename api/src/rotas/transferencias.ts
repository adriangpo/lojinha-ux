import { createHash } from 'node:crypto'
import { setTimeout as esperar } from 'node:timers/promises'
import { Router, type Request, type Response } from 'express'
import { sql } from '../banco'

type Transferencia = {
  id: number
  para: string
  valorCentavos: number
  chave: string | null
  criadoEm: string
}

type Pix = { para: string; valorCentavos: number }

// Mesmo formato do tema Erros úteis: { errors: [{ code, message, field }] }.
// Sem field quando o problema não é de um campo só (ex.: Pix duplicado).
type ErroDeCampo = { code: string; message: string; field?: string }

// Curtos para dar tempo de ver acontecer na apresentação.
// Na vida real a chave vale umas 24h e a janela de Pix duplicado, alguns minutos.
const VALIDADE_DA_CHAVE_MS = 30_000
const JANELA_DE_DUPLICADO_MS = 15_000

// As horas saem daqui, e não do now() do banco: no Docker do Windows o relógio do container
// às vezes fica segundos fora do relógio do PC, e com janelas de 15s isso aparece na demo.

export const rotasDeTransferencias = Router()

// GET /api/transferencias - a tabela que aparece embaixo do botão "Transferir".
rotasDeTransferencias.get('/transferencias', async (_req, res) => {
  const transferencias = await sql<Transferencia>(
    `SELECT id, para, valor_centavos AS "valorCentavos", chave_de_idempotencia AS chave, criado_em AS "criadoEm"
     FROM transferencias ORDER BY id DESC`,
  )
  res.json(transferencias)
})

// DELETE /api/transferencias - zera as tabelas entre uma versão e outra da demo.
rotasDeTransferencias.delete('/transferencias', async (_req, res) => {
  await sql('DELETE FROM chaves_de_idempotencia')
  await sql('DELETE FROM transferencias')
  res.json({ ok: true })
})

// POST /api/transferencias  { para, valorCentavos }  (cabeçalho opcional: Idempotency-Key)
rotasDeTransferencias.post('/transferencias', (req, res) => transferir(req, res, { checarDuplicado: false }))

// POST /api/transferencias-com-checagem  { para, valorCentavos }  + Idempotency-Key
// Além da chave, bloqueia por um tempo um Pix igual (mesma pessoa, mesmo valor) a outro feito há pouco.
rotasDeTransferencias.post('/transferencias-com-checagem', (req, res) => transferir(req, res, { checarDuplicado: true }))

function validar({ para, valorCentavos }: Pix) {
  const erros: ErroDeCampo[] = []
  if (para === '') erros.push({ code: 'TRANSFER_RECIPIENT_REQUIRED', message: 'Informe para quem é o Pix', field: 'para' })
  if (!Number.isInteger(valorCentavos) || valorCentavos <= 0) {
    erros.push({ code: 'TRANSFER_AMOUNT_INVALID', message: 'Informe um valor maior que zero', field: 'valorCentavos' })
  }
  return erros
}

async function transferir(req: Request, res: Response, { checarDuplicado }: { checarDuplicado: boolean }) {
  const pix: Pix = { para: String(req.body.para ?? '').trim(), valorCentavos: req.body.valorCentavos }
  const erros = validar(pix)
  if (erros.length > 0) {
    res.status(422).json({ errors: erros })
    return
  }

  const chave = req.get('Idempotency-Key')

  // Sem chave: cada request vira um Pix novo, mesmo que seja o mesmo clique repetido.
  if (!chave) {
    res.status(201).json(await enviarPix(pix))
    return
  }

  // Com chave: reserva a chave ANTES de mexer no dinheiro.
  // Se ela já existe e não expirou, o banco não reserva de novo e quem chegou depois não envia nada.
  // Se expirou, a chave vale como nova: é por isso que a validade tem que cobrir o tempo dos retries.
  const hash = createHash('sha256').update(JSON.stringify(pix)).digest('hex')
  const [reservada] = await sql(
    `INSERT INTO chaves_de_idempotencia (chave, hash_do_corpo, expira_em)
     VALUES ($1, $2, $3)
     ON CONFLICT (chave) DO UPDATE
       SET hash_do_corpo = EXCLUDED.hash_do_corpo, status = 'processando',
           transferencia_id = NULL, expira_em = EXCLUDED.expira_em
       WHERE chaves_de_idempotencia.expira_em < $4
     RETURNING chave`,
    [chave, hash, new Date(Date.now() + VALIDADE_DA_CHAVE_MS), new Date()],
  )
  if (!reservada) {
    await responderComAChaveUsada(res, chave, hash)
    return
  }

  try {
    if (checarDuplicado) {
      const anterior = await ultimoPixIgual(pix)
      if (anterior) {
        // Não é retry (a chave é nova): é o usuário fazendo de novo. Igual demais, rápido demais: bloqueia até a janela passar.
        // A chave é liberada porque este Pix não saiu: depois da espera, a mesma tentativa pode ir.
        await liberar(chave)
        const desde = Math.round((Date.now() - anterior.getTime()) / 1000)
        const faltam = Math.max(1, Math.ceil((anterior.getTime() + JANELA_DE_DUPLICADO_MS - Date.now()) / 1000))
        res.set('Retry-After', String(faltam))
        res.status(409).json({
          errors: [
            {
              code: 'TRANSFER_DUPLICATE',
              message: `Você fez um Pix igual para ${pix.para} há ${desde}s. Espere ${faltam}s para enviar outro igual.`,
            },
          ],
        })
        return
      }
    }

    const transferencia = await enviarPix(pix, chave)
    await sql(`UPDATE chaves_de_idempotencia SET status = 'concluida', transferencia_id = $2 WHERE chave = $1`, [
      chave,
      transferencia.id,
    ])
    res.status(201).json(transferencia)
  } catch (erro) {
    // Falhou no meio: solta a chave para o retry conseguir tentar de novo.
    await liberar(chave)
    throw erro
  }
}

// A chave já estava reservada: decide o que responder sem enviar outro Pix.
async function responderComAChaveUsada(res: Response, chave: string, hash: string) {
  const [usada] = await sql<{ hash: string; status: string; transferenciaId: number | null }>(
    `SELECT hash_do_corpo AS hash, status, transferencia_id AS "transferenciaId"
     FROM chaves_de_idempotencia WHERE chave = $1`,
    [chave],
  )

  // Mesma chave com outro Pix: não é repetição, é outro pedido. Devolver o Pix antigo enganaria o usuário.
  if (usada && usada.hash !== hash) {
    res.status(422).json({
      errors: [
        {
          code: 'IDEMPOTENCY_KEY_REUSED',
          message: 'Essa chave já foi usada em outro Pix',
          field: 'Idempotency-Key',
        },
      ],
    })
    return
  }

  // A primeira ainda está processando: não espera nem envia de novo, só avisa.
  if (!usada || usada.status === 'processando') {
    res.set('Retry-After', '1')
    res.status(409).json({
      errors: [
        {
          code: 'IDEMPOTENCY_KEY_IN_PROGRESS',
          message: 'Esse Pix ainda está sendo processado',
          field: 'Idempotency-Key',
        },
      ],
    })
    return
  }

  // Já terminou: devolve a mesma resposta, sem criar nada. O cabeçalho avisa que é uma repetição.
  res.set('Idempotent-Replayed', 'true')
  res.json({ id: usada.transferenciaId })
}

async function ultimoPixIgual({ para, valorCentavos }: Pix) {
  const [igual] = await sql<{ criadoEm: Date }>(
    `SELECT criado_em AS "criadoEm" FROM transferencias
     WHERE lower(para) = lower($1) AND valor_centavos = $2 AND criado_em > $3
     ORDER BY criado_em DESC LIMIT 1`,
    [para, valorCentavos, new Date(Date.now() - JANELA_DE_DUPLICADO_MS)],
  )
  return igual?.criadoEm
}

async function enviarPix({ para, valorCentavos }: Pix, chave?: string) {
  // Simula o Pix saindo: 1 segundo sem resposta é o que faz o usuário clicar de novo.
  await esperar(1000)
  const [transferencia] = await sql<{ id: number }>(
    'INSERT INTO transferencias (para, valor_centavos, chave_de_idempotencia, criado_em) VALUES ($1, $2, $3, $4) RETURNING id',
    [para, valorCentavos, chave ?? null, new Date()],
  )
  return transferencia
}

function liberar(chave: string) {
  return sql('DELETE FROM chaves_de_idempotencia WHERE chave = $1', [chave])
}
