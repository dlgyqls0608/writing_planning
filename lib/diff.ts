export type DiffType = 'added' | 'removed' | 'unchanged'

export interface DiffLine {
  type: DiffType
  text: string
}

export function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const m = oldLines.length
  const n = newLines.length

  // Fallback for very large docs to avoid O(m*n) memory
  if (m * n > 200_000) {
    return [
      ...oldLines.map((text): DiffLine => ({ type: 'removed', text })),
      ...newLines.map((text): DiffLine => ({ type: 'added', text })),
    ]
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oldLines[i - 1] === newLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  const result: DiffLine[] = []
  let i = m
  let j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: 'unchanged', text: oldLines[i - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', text: newLines[j - 1] })
      j--
    } else {
      result.unshift({ type: 'removed', text: oldLines[i - 1] })
      i--
    }
  }

  return result
}
