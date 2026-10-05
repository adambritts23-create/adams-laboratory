/** Small dense Gaussian elimination with partial pivoting; independent numerical utility. */
export function solveLinear(matrix, rhs) {
  const n = rhs.length
  if (!n) return { ok: true, solution: [], pivotRatio: 1 }
  const a = matrix.map((row, i) => [...row, rhs[i]])
  const norm = Math.max(...matrix.flat().map(Math.abs))
  if (!Number.isFinite(norm) || norm === 0) return { ok: false, reason: 'singular-or-ill-conditioned' }
  let minPivot = Infinity, maxPivot = 0
  for (let k = 0; k < n; k++) {
    let pivot = k
    for (let i = k + 1; i < n; i++) if (Math.abs(a[i][k]) > Math.abs(a[pivot][k])) pivot = i
    const size = Math.abs(a[pivot][k])
    if (!Number.isFinite(size) || size <= norm * 1e-14) return { ok: false, reason: 'singular-or-ill-conditioned' }
    minPivot = Math.min(minPivot, size); maxPivot = Math.max(maxPivot, size)
    ;[a[k], a[pivot]] = [a[pivot], a[k]]
    for (let i = k + 1; i < n; i++) {
      const factor = a[i][k] / a[k][k]
      for (let j = k + 1; j <= n; j++) a[i][j] -= factor * a[k][j]
      a[i][k] = 0
    }
  }
  const solution = Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let value = a[i][n]
    for (let j = i + 1; j < n; j++) value -= a[i][j] * solution[j]
    solution[i] = value / a[i][i]
  }
  return solution.every(Number.isFinite) ? { ok: true, solution, pivotRatio: minPivot / maxPivot } : { ok: false, reason: 'nonfinite-step' }
}
