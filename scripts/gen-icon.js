// Generates placeholder app + tray icons (green "focus" square) without external deps.
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1
    }
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function makePng(size) {
  const cx = (size - 1) / 2
  const cy = (size - 1) / 2
  const radius = size * 0.42
  const corner = size * 0.22
  const raw = Buffer.alloc(size * (size * 4 + 1))
  let p = 0

  for (let y = 0; y < size; y++) {
    raw[p++] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      // Rounded-square background mask.
      const insideSquare =
        x >= size * 0.08 && x <= size * 0.92 && y >= size * 0.08 && y <= size * 0.92
      let r = 15
      let g = 19
      let b = 28
      let a = 0

      if (insideSquare) {
        r = 12
        g = 18
        b = 26
        a = 255
      }

      // Glowing ring.
      const d = Math.hypot(x - cx, y - cy)
      if (Math.abs(d - radius) < size * 0.08) {
        r = 0
        g = 240
        b = 118
        a = 255
      }

      // Inner dot.
      if (d < corner) {
        r = 0
        g = 240
        b = 118
        a = 255
      }

      raw[p++] = r
      raw[p++] = g
      raw[p++] = b
      raw[p++] = a
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ])
}

const buildDir = path.join(__dirname, '..', 'build')
const resDir = path.join(__dirname, '..', 'resources')
fs.mkdirSync(buildDir, { recursive: true })
fs.mkdirSync(resDir, { recursive: true })

fs.writeFileSync(path.join(buildDir, 'icon.png'), makePng(256))
fs.writeFileSync(path.join(resDir, 'icon.png'), makePng(256))
fs.writeFileSync(path.join(resDir, 'tray.png'), makePng(32))

console.log('Generated icons in build/ and resources/')
