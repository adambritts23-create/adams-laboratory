import { readFile, realpath } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { inflateRawSync } from 'node:zlib'
import { createHash } from 'node:crypto'
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const crc32 = bytes => {
  let crc = 0xffffffff
  for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0) }
  return (crc ^ 0xffffffff) >>> 0
}
/** Reads only requested ZIP entries into memory. No extraction, source writes or process execution. */
export function readZipEntry(archive, name) {
  let end = -1
  for (let i = archive.length - 22; i >= Math.max(0, archive.length - 65557); i--) {
    if (archive.readUInt32LE(i) === 0x06054b50 && i + 22 + archive.readUInt16LE(i + 20) === archive.length) { end = i; break }
  }
  if (end < 0) throw new Error('ZIP end directory not found')
  if (archive.readUInt16LE(end + 4) || archive.readUInt16LE(end + 6)) throw new Error('Multi-volume ZIP unsupported')
  const count = archive.readUInt16LE(end + 10)
  let offset = archive.readUInt32LE(end + 16)
  if (count === 0xffff || offset === 0xffffffff) throw new Error('ZIP64 unsupported; provide an existing extracted folder')
  const matches = []
  for (let i = 0; i < count; i++) {
    if (archive.readUInt32LE(offset) !== 0x02014b50) throw new Error('Malformed ZIP directory')
    const flags = archive.readUInt16LE(offset + 8), method = archive.readUInt16LE(offset + 10)
    const checksum = archive.readUInt32LE(offset + 16), compressed = archive.readUInt32LE(offset + 20), size = archive.readUInt32LE(offset + 24)
    const nameLength = archive.readUInt16LE(offset + 28), extra = archive.readUInt16LE(offset + 30), comment = archive.readUInt16LE(offset + 32)
    const local = archive.readUInt32LE(offset + 42)
    const entryName = archive.subarray(offset + 46, offset + 46 + nameLength).toString('utf8')
    if (entryName === name) matches.push({ flags, method, checksum, compressed, size, local })
    offset += 46 + nameLength + extra + comment
  }
  if (!matches.length) return null
  if (matches.length !== 1) throw new Error(`Ambiguous duplicate ZIP entry: ${name}`)
  const { flags, method, checksum, compressed, size, local } = matches[0]
  if (flags & 1 || ![0, 8].includes(method) || size > 64 * 1024 * 1024) throw new Error('Encrypted, oversized or unsupported ZIP entry')
  if (archive.readUInt32LE(local) !== 0x04034b50) throw new Error('Malformed local ZIP header')
  const start = local + 30 + archive.readUInt16LE(local + 26) + archive.readUInt16LE(local + 28)
  if (start + compressed > archive.length) throw new Error('Truncated ZIP entry')
  const packed = archive.subarray(start, start + compressed)
  const bytes = method === 0 ? packed : inflateRawSync(packed, { maxOutputLength: 64 * 1024 * 1024 })
  if (bytes.length !== size || crc32(bytes) !== checksum) throw new Error(`ZIP length/CRC mismatch: ${name}`)
  return bytes
}
export async function openSource({ folder, archive, prefix = 'Eq-Diagr/' }) {
  if (!!folder === !!archive) throw new Error('Specify exactly one --folder or --archive')
  const sourcePath = await realpath(resolve(folder ?? archive))
  const zip = archive ? await readFile(sourcePath) : null
  if (prefix.startsWith('/') || prefix.includes('..') || prefix.includes('\\')) throw new Error('Use a relative ZIP prefix with forward slashes')
  const manifest = []
  return {
    sourcePath, archiveHash: zip ? sha256(zip) : null, manifest,
    async read(name, required = true) {
      if (!/^[\w.-]+$/.test(name)) throw new Error('Only direct source filenames are allowed')
      let bytes, sourceFile
      if (zip) { sourceFile = `${sourcePath}!${prefix}${name}`; bytes = readZipEntry(zip, `${prefix}${name}`) }
      else {
        sourceFile = join(sourcePath, name)
        try { bytes = await readFile(sourceFile) } catch (error) { if (error.code !== 'ENOENT') throw error }
      }
      if (!bytes) { if (required) throw new Error(`Missing source file ${name}`); return null }
      manifest.push({ name, sourceFile, size: bytes.length, sha256: sha256(bytes) })
      return { bytes, sourceFile }
    },
  }
}
