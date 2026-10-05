/** Java DataInputStream primitives, used by LibDB.getBinComplex/readElemFileBinary. */
export class BinaryReader {
  constructor(bytes) { this.bytes = bytes; this.offset = 0 }
  require(size) { if (this.offset + size > this.bytes.length) throw new Error(`Truncated record at byte ${this.offset}: need ${size} bytes`) }
  uint16() { this.require(2); const v = this.bytes.readUInt16BE(this.offset); this.offset += 2; return v }
  int32() { this.require(4); const v = this.bytes.readInt32BE(this.offset); this.offset += 4; return v }
  double() { this.require(8); const v = this.bytes.readDoubleBE(this.offset); this.offset += 8; return v }
  float() { this.require(4); const v = this.bytes.readFloatBE(this.offset); this.offset += 4; return v }
  utf() {
    const size = this.uint16(); this.require(size)
    const end = this.offset + size, units = []
    while (this.offset < end) {
      const a = this.bytes[this.offset++]
      if (a <= 0x7f) { units.push(a); continue }
      const following = count => {
        if (this.offset + count > end) throw new Error('Truncated modified-UTF sequence')
        const out = []
        for (let i = 0; i < count; i++) {
          const b = this.bytes[this.offset++]
          if ((b & 0xc0) !== 0x80) throw new Error('Malformed modified-UTF continuation')
          out.push(b & 0x3f)
        }
        return out
      }
      if ((a & 0xe0) === 0xc0) { const [b] = following(1); units.push(((a & 31) << 6) | b) }
      else if ((a & 0xf0) === 0xe0) { const [b, c] = following(2); units.push(((a & 15) << 12) | (b << 6) | c) }
      else throw new Error('Unsupported/malformed Java modified-UTF leading byte')
    }
    return String.fromCharCode(...units)
  }
}
export const EMPTY = -999999.9, ANALYTIC = -888888.8, LOOKUP = -777777.7
// JSON-safe representation preserves non-finite source numbers explicitly; raw bytes retain payload bits.
export const sourceNumber = n => Number.isFinite(n) ? (Object.is(n, -0) ? '-0' : n) : String(n)
export const knownNumber = n => Number.isFinite(n) && n !== EMPTY ? n : null

export function parseDb(bytes) {
  const reader = new BinaryReader(bytes), records = [], diagnostics = []
  if (!bytes.length) diagnostics.push({ severity: 'error', byteOffset: 0, message: 'Empty reaction database' })
  while (reader.offset < bytes.length) {
    const start = reader.offset
    try {
      const name = reader.utf()
      if (!name.trim()) throw new Error('Empty product name')
      const logK = reader.double(), flag = reader.double()
      let thermal
      if (flag === ANALYTIC) {
        const tMax = reader.double(), coefficients = Array.from({ length: 6 }, () => reader.double())
        thermal = { kind: 'analytic', flag, tMax, coefficients }
      } else if (flag === LOOKUP) thermal = { kind: 'lookup', flag, tMax: reader.double() }
      else thermal = { kind: 'deltaH-deltaCp', deltaH: flag, deltaCp: reader.double() }
      const first = reader.utf()
      const count = /^[+-]?\d+$/.test(first) && Number(first) >= -2147483648 && Number(first) <= 2147483647 ? Number(first) : -1
      const components = []
      let protonCount = null
      if (count > 0) {
        if (count > 100000) throw new Error('Unreasonable component count; unsupported or corrupted format')
        for (let i = 0; i < count; i++) components.push({ name: reader.utf(), coefficient: reader.double() })
      } else {
        for (let i = 0; i < 6; i++) components.push({ name: i ? reader.utf() : first, coefficient: reader.double() })
        protonCount = reader.double()
      }
      const reference = reader.utf(), comment = reader.utf()
      if (thermal.kind === 'lookup') thermal.rows = [9, 11, 14, 14, 14].map(n => Array.from({ length: n }, () => reader.float()))
      const end = reader.offset
      const record = { ordinal: records.length + 1, byteOffset: start, byteLength: end - start, name, logK, thermal,
        layout: count > 0 ? 'variable' : 'six-slot', componentToken: first, components, protonCount, reference, comment,
        rawBase64: bytes.subarray(start, end).toString('base64') }
      records.push(record)
      if (thermal.kind === 'lookup' && thermal.tMax !== 600) diagnostics.push({ severity: 'error', recordId: record.ordinal, byteOffset: start, message: 'Official reader requires lookup tMax=600 °C.' })
      if (thermal.kind === 'analytic' && (!Number.isFinite(thermal.tMax) || thermal.tMax > 373)) diagnostics.push({ severity: 'error', recordId: record.ordinal, byteOffset: start, message: 'Analytic tMax is unsupported by the official reader.' })
    } catch (error) {
      diagnostics.push({ severity: 'error', byteOffset: start, failureOffset: reader.offset, message: error.message })
      break // No record framing exists: never guess the next boundary.
    }
  }
  return { records, diagnostics, bytesRead: reader.offset, complete: reader.offset === bytes.length && !diagnostics.some(d => d.severity === 'error') }
}

export function parseElb(bytes) {
  const reader = new BinaryReader(bytes), entries = [], diagnostics = []
  if (!bytes.length) diagnostics.push({ severity: 'error', byteOffset: 0, message: 'Empty element/component database' })
  while (reader.offset < bytes.length) {
    const start = reader.offset
    try {
      const element = reader.utf()
      if (!element) {
        if (reader.offset !== bytes.length) throw new Error('Unexpected bytes after empty element terminator')
        break
      }
      const count = reader.int32()
      if (count < 0 || count > 100000) throw new Error('Unsupported element component count')
      const components = Array.from({ length: count }, () => ({ name: reader.utf(), description: reader.utf() }))
      entries.push({ element, components, byteOffset: start, byteLength: reader.offset - start,
        rawBase64: bytes.subarray(start, reader.offset).toString('base64') })
    } catch (error) { diagnostics.push({ severity: 'error', byteOffset: start, message: error.message }); break }
  }
  return { entries, diagnostics, complete: reader.offset === bytes.length && !diagnostics.length }
}
