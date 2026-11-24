/**
 * Renders the README example images from the real parser: node scripts/render-examples.ts
 * Each image shows what the reply contains on top and what the terminal draws below.
 */
import { mkdirSync, writeFileSync } from 'node:fs'

import { LEGACY_COLORS, scan, toBlocks } from '../hooks/format.ts'
import type { Run } from '../hooks/format.ts'
import { EXAMPLES } from './examples.ts'

const FONT_SIZE = 14
const CHAR_WIDTH = FONT_SIZE * 0.6
const LINE_HEIGHT = 21
const PAD = 22
const TITLE_BAR = 34
const COLORS = { bg: '#1a1b26', bar: '#16161e', fg: '#c0caf5', muted: '#565f89', code: '#7aa2f7', fence: '#13141c', rule: '#292e42' }

type Line = { runs: Run[]; fill?: string }

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const splitLines = (runs: Run[]): Line[] => {
  const lines: Line[] = [{ runs: [] }]
  for (const run of runs) {
    run.text.split('\n').forEach((part, index) => {
      if (index > 0) lines.push({ runs: [] })
      if (part) lines.at(-1)!.runs.push({ ...run, text: part })
    })
  }
  return lines
}

const renderedLines = (text: string): Line[] => {
  const lines: Line[] = []
  toBlocks(text, { legacy: true }).forEach((block, index) => {
    if (index > 0) lines.push({ runs: [] })
    if (block.kind === 'styled') {
      lines.push(...splitLines(block.runs))
      return
    }
    for (const part of block.text.split(/\n{2,}/)) {
      if (/^ {0,3}(`{3,}|~{3,})/.test(part)) {
        const body = part.split('\n').filter(line => !/^ {0,3}(`{3,}|~{3,})/.test(line))
        lines.push(...body.map(line => ({ runs: [{ text: line, color: COLORS.fg }], fill: COLORS.fence })))
      } else {
        lines.push(...splitLines(scan(part, { markdown: true }).runs))
      }
    }
  })
  return lines
}

const sourceLines = (text: string): Line[] =>
  text.split('\n').map(line => ({ runs: [{ text: line, color: COLORS.muted }] }))

const width = (line: Line) => line.runs.reduce((sum, run) => sum + [...run.text].length, 0)

const drawLine = (line: Line, y: number, totalWidth: number) => {
  const out: string[] = []
  if (line.fill) out.push(`<rect x="${PAD - 8}" y="${y - 15}" width="${totalWidth - 2 * PAD + 16}" height="${LINE_HEIGHT}" fill="${line.fill}"/>`)
  let column = 0
  for (const run of line.runs) {
    const x = PAD + column * CHAR_WIDTH
    const length = [...run.text].length
    const runWidth = length * CHAR_WIDTH
    let fg = run.color ?? (run.code ? COLORS.code : COLORS.fg)
    let bg = run.bg
    if (run.inverse) [fg, bg] = [bg ?? COLORS.bg, fg]
    if (bg) out.push(`<rect x="${x}" y="${y - 15}" width="${runWidth}" height="${LINE_HEIGHT}" fill="${bg}"/>`)
    const attrs = [
      `x="${[...run.text].map((_, index) => (x + index * CHAR_WIDTH).toFixed(1)).join(' ')}"`,
      `y="${y}"`,
      `fill="${fg}"`,
      run.bold ? 'font-weight="700"' : '',
      run.italic ? 'font-style="italic"' : '',
      run.dim ? 'opacity="0.55"' : '',
    ].filter(Boolean)
    out.push(`<text ${attrs.join(' ')}>${escapeXml(run.text.replace(/ /g, '\u00a0'))}</text>`)
    if (run.underline) out.push(`<rect x="${x}" y="${y + 3}" width="${runWidth}" height="1.2" fill="${fg}"/>`)
    if (run.strike) out.push(`<rect x="${x}" y="${y - 4.5}" width="${runWidth}" height="1.2" fill="${fg}"/>`)
    column += length
  }
  return out.join('')
}

const renderSvg = (title: string, source: string, isSourceShown: boolean) => {
  const top = isSourceShown ? sourceLines(source) : []
  const bottom = renderedLines(source)
  const columns = Math.max(48, ...[...top, ...bottom].map(width))
  const totalWidth = Math.ceil(columns * CHAR_WIDTH + 2 * PAD)
  const sections = isSourceShown ? 2 : 1
  const labelSpace = isSourceShown ? 26 : 0
  const height = TITLE_BAR + PAD + (top.length + bottom.length) * LINE_HEIGHT + (sections - 1) * (PAD + 1) + sections * labelSpace + PAD

  const parts: string[] = []
  let y = TITLE_BAR + PAD
  const label = (text: string) => {
    parts.push(`<text x="${PAD}" y="${y + 6}" fill="${COLORS.muted}" font-size="11" letter-spacing="1.5">${text}</text>`)
    y += labelSpace
  }
  if (isSourceShown) {
    label('REPLY TEXT')
    top.forEach(line => {
      parts.push(drawLine(line, y + 10, totalWidth))
      y += LINE_HEIGHT
    })
    parts.push(`<rect x="0" y="${y + PAD / 2 - 6}" width="${totalWidth}" height="1" fill="${COLORS.rule}"/>`)
    y += PAD + 1
    label('TERMINAL')
  }
  bottom.forEach(line => {
    parts.push(drawLine(line, y + 10, totalWidth))
    y += LINE_HEIGHT
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', monospace" font-size="${FONT_SIZE}" xml:space="preserve" style="white-space: pre">
<rect width="100%" height="100%" rx="10" fill="${COLORS.bg}"/>
<path d="M0 10 a10 10 0 0 1 10 -10 h${totalWidth - 20} a10 10 0 0 1 10 10 v${TITLE_BAR - 10} h-${totalWidth} z" fill="${COLORS.bar}"/>
<circle cx="20" cy="17" r="6" fill="#ff5f57"/><circle cx="40" cy="17" r="6" fill="#febc2e"/><circle cx="60" cy="17" r="6" fill="#28c840"/>
<text x="${totalWidth / 2}" y="21" fill="${COLORS.muted}" font-size="12" text-anchor="middle">${escapeXml(title)}</text>
${parts.join('\n')}
</svg>
`
}

const codesTable = () =>
  LEGACY_COLORS.map(([code, name]) => `§${code}§l§${code}${code}§r §${code}${name.padEnd(13)}`)
    .reduce<string[]>((rows, cell, index) => {
      if (index % 4 === 0) rows.push('')
      rows[rows.length - 1] += cell
      return rows
    }, [])
    .join('\n') + '\n\n§l§ll bold§r  §o§oo italic§r  §n§nn underline§r  §m§mm strike§r  §kkk§r k obfuscated  r reset'

mkdirSync(new URL('../docs/images/', import.meta.url), { recursive: true })
for (const example of [...EXAMPLES, { file: 'legacy-codes', title: 'claude-color: legacy codes', source: codesTable(), isSourceShown: false }]) {
  const svg = renderSvg(example.title, example.source, example.isSourceShown)
  writeFileSync(new URL(`../docs/images/${example.file}.svg`, import.meta.url), svg)
  console.log(`docs/images/${example.file}.svg`)
}
