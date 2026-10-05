/** UTF-8 Java Properties.load(Reader), as used by References.readRefsFile. */
function unescapeProperty(text) {
  return text.replace(/\\(u[0-9a-fA-F]{4}|u[^\s]{0,4}|[\s\S])/g, (_, escaped) => {
    if (escaped.startsWith('u')) {
      if (!/^u[0-9a-fA-F]{4}$/.test(escaped)) throw new Error('Malformed Unicode escape in reference properties')
      return String.fromCharCode(parseInt(escaped.slice(1), 16))
    }
    return ({ t: '\t', n: '\n', r: '\r', f: '\f' })[escaped] ?? escaped
  })
}
export function parseReferences(text) {
  const entries = [], diagnostics = [], mapping = Object.create(null)
  const lines = text.split(/\r\n|\n|\r/)
  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1, rawLines = [lines[i]]
    let line = lines[i].replace(/^[ \t\f]+/, '')
    if (!line || /^[#!]/.test(line)) continue
    while ((line.match(/\\+$/)?.[0].length ?? 0) % 2) {
      line = line.slice(0, -1)
      if (++i >= lines.length) break
      rawLines.push(lines[i]); line += lines[i].replace(/^[ \t\f]+/, '')
    }
    try {
      let split = line.length, escaped = false
      for (let j = 0; j < line.length; j++) {
        if (!escaped && /[=: \t\f]/.test(line[j])) { split = j; break }
        escaped = line[j] === '\\' && !escaped
      }
      let valueStart = split
      while (/[ \t\f]/.test(line[valueStart] ?? '') && valueStart < line.length) valueStart++
      if (line[valueStart] === '=' || line[valueStart] === ':') valueStart++
      while (/[ \t\f]/.test(line[valueStart] ?? '') && valueStart < line.length) valueStart++
      const key = unescapeProperty(line.slice(0, split)), value = unescapeProperty(line.slice(valueStart))
      if (Object.hasOwn(mapping, key)) diagnostics.push({ severity: 'warning', line: lineNumber, message: `Duplicate reference key ${key}; Java Properties keeps the last value. Raw entries retained.` })
      mapping[key] = value; entries.push({ key, value, lineNumber, raw: rawLines.join('\n') })
    } catch (error) { diagnostics.push({ severity: 'error', line: lineNumber, message: error.message }) }
  }
  return { mapping, entries, diagnostics }
}
// References.splitRefs treats a bracketed expression as a separate token.
export function splitReferences(text) {
  const tokens = [], split = value => tokens.push(...value.split(/[+,;]/).map(s => s.trim()).filter(Boolean))
  let rest = text.trim()
  while (true) {
    const open = rest.search(/[([{]/)
    if (open < 0) break
    const left = rest[open], right = { '(': ')', '[': ']', '{': '}' }[left]
    let depth = 1, end = open + 1
    while (end < rest.length && depth) { if (rest[end] === left) depth++; if (rest[end] === right) depth--; end++ }
    if (depth) break
    split(rest.slice(0, open)); tokens.push(rest.slice(open, end)); rest = rest.slice(end)
  }
  split(rest)
  return tokens
}
export function resolveReferences(text, mapping) {
  return splitReferences(text).map(code => {
    const exact = Object.hasOwn(mapping, code) ? code : null
    const matches = exact ? [exact] : Object.keys(mapping).filter(key => key.toLowerCase() === code.toLowerCase())
    return { code, matchedKey: matches.length === 1 ? matches[0] : null,
      citation: matches.length === 1 && mapping[matches[0]].trim() ? mapping[matches[0]].trim() : null,
      status: matches.length > 1 ? 'ambiguous' : matches.length === 1 ? 'resolved' : 'unresolved' }
  })
}
