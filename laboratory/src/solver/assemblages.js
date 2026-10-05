export const multiSolidPolicy = 'bounded-multisolid-v1'
export const assemblageLimits = Object.freeze({ candidates: 12, subsets: 1024, rankThreshold: 1e-14 })

/** Row-normalized rank gate; same relative conditioning threshold as dense Newton. */
export function phaseRank(rows) {
  const a = rows.map(row => { const scale = Math.max(0, ...row.map(Math.abs)); return row.map(x => scale ? x / scale : 0) })
  let rank = 0
  for (let col = 0; col < (a[0]?.length ?? 0) && rank < a.length; col++) {
    let pivot = rank
    for (let i = rank + 1; i < a.length; i++) if (Math.abs(a[i][col]) > Math.abs(a[pivot][col])) pivot = i
    if (Math.abs(a[pivot][col]) <= assemblageLimits.rankThreshold) continue
    ;[a[rank], a[pivot]] = [a[pivot], a[rank]]
    for (let i = rank + 1; i < a.length; i++) {
      const factor = a[i][col] / a[rank][col]
      for (let j = col; j < a[i].length; j++) a[i][j] -= factor * a[rank][j]
    }
    rank++
  }
  return rank
}

export function enumerateAssemblages(system, input) {
  const unknown = input.constraints.flatMap((c, i) => c.kh === 1 ? [i] : [])
  const candidates = [...system.solidRows].sort((a, b) => system.products[a].id < system.products[b].id ? -1 : 1)
  const row = j => unknown.map(i => system.products[j].coefficients[i])
  const maximumActive = phaseRank(candidates.map(row)), subsets = [[]]
  let exceeded = false
  function visit(start, selected, size) {
    if (exceeded) return
    if (selected.length === size) {
      subsets.push([...selected]); if (subsets.length > assemblageLimits.subsets) exceeded = true
      return
    }
    for (let i = start; i < candidates.length; i++) visit(i + 1, [...selected, candidates[i]], size)
  }
  for (let size = 1; size <= maximumActive && !exceeded; size++) visit(0, [], size)
  return exceeded ? { ok: false, code: 'assemblage-search-limit', maximumActive, limit: assemblageLimits.subsets } : {
    ok: true, maximumActive, subsets: subsets.map(rows => ({ rows, independent: phaseRank(rows.map(row)) === rows.length })),
  }
}

// Large source scopes must use active iteration, never subset enumeration.
// Retain the existing 128-product storage envelope and 24-step deterministic closure budget.
export const sourceSolidPolicy='source-pure-solid-active-v1'
export const sourceSolidLimits=Object.freeze({sourceSpecies:128,sourceReactions:128})
