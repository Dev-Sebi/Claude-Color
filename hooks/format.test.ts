import { expect, test } from 'claude-code/testing'

import { gradientAt, parseTag, toBlocks } from './format'

const styled = (text: string, legacy = true) => {
  const blocks = toBlocks(text, { legacy })
  const block = blocks.find(one => one.kind === 'styled')
  return block?.kind === 'styled' ? block.runs : []
}

test('named, hex and classic-named colors resolve', () => {
  expect(styled('{red}a{/}')[0]).toEqual({ color: '#e5484d', text: 'a' })
  expect(styled('{#f80}a{/}')[0]).toEqual({ color: '#ff8800', text: 'a' })
  expect(styled('{gold}a{/}')[0]).toEqual({ color: '#ffaa00', text: 'a' })
})

test('one tag combines styles, color and background', () => {
  expect(styled('{bold red bg:black}a{/}')[0]).toEqual({ bold: true, color: '#e5484d', bg: '#000000', text: 'a' })
})

test('tags nest and close in order', () => {
  const runs = styled('{red}a{bold}b{/}c{/}d')
  expect(runs.map(run => [run.text, run.color, !!run.bold])).toEqual([
    ['a', '#e5484d', false],
    ['b', '#e5484d', true],
    ['c', '#e5484d', false],
    ['d', undefined, false],
  ])
})

test('unknown tags stay as written', () => {
  expect(toBlocks('{nope}a{/}')).toEqual([{ kind: 'markdown', text: '{nope}a{/}' }])
})

test('escaped braces stay literal', () => {
  expect(styled('\\{red} {green}ok{/}').map(run => run.text).join('')).toBe('{red} ok')
})

test('a gradient spreads over its characters', () => {
  const runs = styled('{gradient:#000000:#ffffff}abc{/}')
  expect(runs.map(run => run.color)).toEqual(['#000000', '#808080', '#ffffff'])
  expect(gradientAt(['#000000', '#ffffff'], 0.5)).toBe('#808080')
})

test('legacy color codes reset format codes', () => {
  const runs = styled('§6§lA§eB§rC')
  expect(runs).toEqual([
    { color: '#ffaa00', bold: true, text: 'A' },
    { color: '#ffff55', text: 'B' },
    { text: 'C' },
  ])
})

test('ampersand codes, hex and long hex', () => {
  expect(styled('&aA')[0]).toEqual({ color: '#55ff55', text: 'A' })
  expect(styled('&#123abcA')[0]).toEqual({ color: '#123abc', text: 'A' })
  expect(styled('§x§1§2§3§a§b§cA')[0]).toEqual({ color: '#123abc', text: 'A' })
})

test('ampersands in prose, URLs and entities are not codes', () => {
  for (const text of ['a=1&b=2', 'R&D', 'Tom &amp; Jerry', '?x=1&c=3']) {
    expect(toBlocks(text)).toEqual([{ kind: 'markdown', text }])
  }
})

test('legacy codes can be switched off', () => {
  expect(toBlocks('§aA', { legacy: false })).toEqual([{ kind: 'markdown', text: '§aA' }])
})

test('obfuscated text is scrambled', () => {
  const run = styled('§kabc')[0]!
  expect(run.obfuscated).toBe(true)
  expect(run.text).not.toBe('abc')
  expect(run.text.length).toBe(3)
})

test('code fences and inline code are left alone', () => {
  const blocks = toBlocks('\`\`\`\n{red}x{/}\n\`\`\`\n\n{blue}y{/} \`{red}z{/}\`')
  expect(blocks[0]).toEqual({ kind: 'markdown', text: '\`\`\`\n{red}x{/}\n\`\`\`' })
  expect(blocks[1]).toEqual({
    kind: 'styled',
    runs: [{ color: '#3e63dd', text: 'y' }, { text: ' ' }, { code: true, text: '{red}z{/}' }],
  })
})

test('tables keep markdown with tags stripped', () => {
  expect(toBlocks('| a | {red}b{/} |\n|---|---|')).toEqual([{ kind: 'markdown', text: '| a | b |\n|---|---|' }])
})

test('inline markdown works inside a styled paragraph', () => {
  const runs = styled('- **a** *b* ~~c~~ {red}d{/}')
  expect(runs).toEqual([
    { text: '• ' },
    { bold: true, text: 'a' },
    { text: ' ' },
    { italic: true, text: 'b' },
    { text: ' ' },
    { strike: true, text: 'c' },
    { text: ' ' },
    { color: '#e5484d', text: 'd' },
  ])
})

test('parseTag refuses a gradient with one stop', () => {
  expect(parseTag('gradient:#ff0000')).toBe(undefined)
})
