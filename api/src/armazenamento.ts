// Infraestrutura: conexão com o MinIO (S3 local) e as fotos dos produtos dentro dele.
import { CreateBucketCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { sql } from './banco'
import { imagemDoProduto } from './imagens'

export const BUCKET = 'fotos'

const configuracao = {
  region: 'us-east-1',
  forcePathStyle: true,
  credentials: { accessKeyId: 'lojinha', secretAccessKey: 'lojinha123' },
}

// A API fala direto com o MinIO.
export const s3 = new S3Client({ ...configuracao, endpoint: 'http://localhost:9000' })

// As URLs assinadas apontam para o Vite (que repassa /fotos para o MinIO), porque a assinatura inclui o host.
// Assim as fotos vêm da mesma origem da página, e o monitor consegue ver se vieram da rede ou do cache.
export const assinador = new S3Client({ ...configuracao, endpoint: 'http://localhost:5173' })

// Na subida da API: cria o bucket e envia uma foto por produto, se ainda não tiver.
export async function prepararFotos() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }))
    return
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }))
  }

  const produtos = await sql<{ id: number }>('SELECT id FROM produtos')
  for (const { id } of produtos) {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `${id}.jpg`,
        Body: await imagemDoProduto(id),
        ContentType: 'image/jpeg',
        // O navegador pode guardar a foto por 1 hora... se a URL for a mesma.
        CacheControl: 'max-age=3600',
      }),
    )
  }
  console.log(`MinIO: ${produtos.length} fotos enviadas`)
}
