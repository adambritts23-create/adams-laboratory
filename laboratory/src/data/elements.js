// Compact periodic-table subset. U is displayed separately as an actinide.
export const elements = [
  ['H', 'Hydrogen', 1, 1, 1], ['C', 'Carbon', 6, 2, 14],
  ['N', 'Nitrogen', 7, 2, 15], ['O', 'Oxygen', 8, 2, 16], ['F', 'Fluorine', 9, 2, 17],
  ['Cl', 'Chlorine', 17, 3, 17], ['Ca', 'Calcium', 20, 4, 2], ['Cr', 'Chromium', 24, 4, 6],
  ['Fe', 'Iron', 26, 4, 8], ['Cu', 'Copper', 29, 4, 11], ['U', 'Uranium', 92, 5, 3],
].map(([symbol, name, atomicNumber, row, column]) => ({ symbol, name, atomicNumber, row, column }))
