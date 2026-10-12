// Infraestrutura: gera uma "foto" JPEG para cada id (~30 KB), sem precisar de arquivos no disco.
// O ruído de fundo existe só para a imagem ter um tamanho realista.
import sharp from 'sharp'

const geradas = new Map<number, Buffer>()

export async function imagemDoProduto(id: number) {
  const pronta = geradas.get(id)
  if (pronta) return pronta

  const matiz = (id * 47) % 360
  const desenho = `<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">
    <rect width="640" height="480" fill="hsl(${matiz}, 55%, 55%)" fill-opacity="0.75"/>
    <text x="320" y="270" font-family="Arial" font-size="96" font-weight="700" fill="white" text-anchor="middle">#${id}</text>
  </svg>`

  const imagem = await sharp({
    create: { width: 640, height: 480, channels: 3, background: 'gray', noise: { type: 'gaussian', mean: 128, sigma: 40 } },
  })
    .composite([{ input: Buffer.from(desenho) }])
    .jpeg({ quality: 70 })
    .toBuffer()

  geradas.set(id, imagem)
  return imagem
}
