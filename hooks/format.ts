export type Style = {
  color?: string
  bg?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  dim?: boolean
  inverse?: boolean
  obfuscated?: boolean
  code?: boolean
}

export type Run = Style & { text: string }

export type Block = { kind: 'markdown'; text: string } | { kind: 'styled'; runs: Run[] }

export type FormatOptions = { legacy?: boolean }

type Frame = Style & { gradient?: readonly string[]; gradientId?: number }

type RawRun = Frame & { text: string }

export const PALETTE: Readonly<Record<string, string>> = {
  red: '#e5484d',
  orange: '#f76b15',
  yellow: '#ffc53d',
  green: '#30a46c',
  teal: '#12a594',
  cyan: '#00a2c7',
  blue: '#3e63dd',
  purple: '#8e4ec6',
  pink: '#d6409f',
  gray: '#8b8d98',
  white: '#ffffff',
  black: '#000000',
}

/** The 16 legacy color codes: code, name, hex. */
export const LEGACY_COLORS: readonly (readonly [string, string, string])[] = [
  ['0', 'black', '#000000'],
  ['1', 'dark_blue', '#0000aa'],
  ['2', 'dark_green', '#00aa00'],
  ['3', 'dark_aqua', '#00aaaa'],
  ['4', 'dark_red', '#aa0000'],
  ['5', 'dark_purple', '#aa00aa'],
  ['6', 'gold', '#ffaa00'],
  ['7', 'gray', '#aaaaaa'],
  ['8', 'dark_gray', '#555555'],
  ['9', 'blue', '#5555ff'],
  ['a', 'green', '#55ff55'],
  ['b', 'aqua', '#55ffff'],
  ['c', 'red', '#ff5555'],
  ['d', 'light_purple', '#ff55ff'],
  ['e', 'yellow', '#ffff55'],
  ['f', 'white', '#ffffff'],
]

/** Legacy format codes and the style each one switches on. */
export const LEGACY_FORMATS: Readonly<Record<string, keyof Style>> = {
  k: 'obfuscated',
  l: 'bold',
  m: 'strike',
  n: 'underline',
  o: 'italic',
}

export const GRADIENTS: Readonly<Record<string, readonly string[]>> = {
  rainbow: ['#ff5555', '#ffaa00', '#ffff55', '#55ff55', '#55ffff', '#5555ff', '#ff55ff'],
  fire: ['#ff3b30', '#ff9500', '#ffd60a'],
  ocean: ['#00a2c7', '#3e63dd', '#8e4ec6'],
  sunset: ['#f76b15', '#d6409f', '#8e4ec6'],
  mint: ['#30a46c', '#12a594', '#00a2c7'],
  mono: ['#ffffff', '#555555'],
}

const LEGACY_BY_CODE = new Map(LEGACY_COLORS.map(([code, , hex]) => [code, hex]))
const LEGACY_BY_NAME = new Map(LEGACY_COLORS.map(([, name, hex]) => [name, hex]))

const STYLE_TOKENS: Readonly<Record<string, keyof Style>> = {
  b: 'bold',
  bold: 'bold',
  i: 'italic',
  italic: 'italic',
  u: 'underline',
  underline: 'underline',
  s: 'strike',
  strike: 'strike',
  strikethrough: 'strike',
  dim: 'dim',
  inverse: 'inverse',
  obf: 'obfuscated',
  obfuscated: 'obfuscated',
  magic: 'obfuscated',
}

const OBFUSCATED_GLYPHS = '▓▒░█▚▞▙▟'

export const resolveColor = (token: string): string | undefined => {
  const value = token.toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(value)) return value
  if (/^#[0-9a-f]{3}$/.test(value)) return '#' + [...value.slice(1)].map(c => c + c).join('')
  return PALETTE[value] ?? LEGACY_BY_NAME.get(value)
}

const parseGradient = (token: string): readonly string[] | undefined => {
  if (GRADIENTS[token]) return GRADIENTS[token]
  if (!token.startsWith('gradient:')) return undefined
  const rest = token.slice('gradient:'.length)
  if (GRADIENTS[rest]) return GRADIENTS[rest]
  const stops = rest.split(':').map(resolveColor)
  if (stops.length < 2 || stops.some(stop => !stop)) return undefined
  return stops as string[]
}

/** Parses the inside of an opening tag; undefined when any token is unknown. */
export const parseTag = (inner: string): Frame | undefined => {
  const tokens = inner.trim().split(/\s+/)
  if (tokens.length === 0 || tokens[0] === '') return undefined
  const frame: Frame = {}

  for (const token of tokens) {
    const style = STYLE_TOKENS[token]
    const gradient = parseGradient(token)
    if (style) {
      ;(frame as Record<string, unknown>)[style] = true
    } else if (gradient) {
      frame.gradient = gradient
      delete frame.color
    } else if (token.startsWith('bg:')) {
      const bg = resolveColor(token.slice(3))
      if (!bg) return undefined
      frame.bg = bg
    } else {
      const color = resolveColor(token)
      if (!color) return undefined
      frame.color = color
      delete frame.gradient
    }
  }
  return frame
}

const hexToRgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))

const rgbToHex = (rgb: number[]) =>
  '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')

/** The color at position t (0 to 1) along the gradient's stops. */
export const gradientAt = (stops: readonly string[], t: number): string => {
  const scaled = Math.min(Math.max(t, 0), 1) * (stops.length - 1)
  const index = Math.min(Math.floor(scaled), stops.length - 2)
  const from = hexToRgb(stops[index]!)
  const to = hexToRgb(stops[index + 1]!)
  const local = scaled - index
  return rgbToHex(from.map((v, i) => v + (to[i]! - v) * local))
}

const obfuscate = (text: string) =>
  [...text]
    .map((char, i) =>
      /\s/.test(char) ? char : OBFUSCATED_GLYPHS[(char.charCodeAt(0) + i) % OBFUSCATED_GLYPHS.length],
    )
    .join('')

const sameStyle = (a: Frame, b: Frame) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)].filter(key => key !== 'text'))
  return [...keys].every(key => (a as Record<string, unknown>)[key] === (b as Record<string, unknown>)[key])
}

const isWordChar = (char: string | undefined) => !!char && /[A-Za-z0-9]/.test(char)

type ScanOptions = FormatOptions & { markdown: boolean }

type Scan = { runs: Run[]; hasMarkup: boolean }

/** Turns one paragraph with tags, legacy codes and inline markdown into styled runs. */
export const scan = (source: string, options: ScanOptions): Scan => {
  const raw: RawRun[] = []
  const stack: Frame[] = [{}]
  let legacy: Style = {}
  let bold = false
  let italic = false
  let strike = false
  let heading = false
  let buffer = ''
  let hasMarkup = false
  let lastCodeEnd = -1
  let gradientCount = 0

  const effective = (): Frame => {
    const frame: Frame = { ...stack.at(-1)!, ...legacy }
    if (legacy.color) delete frame.gradient
    if (bold || heading) frame.bold = true
    if (italic) frame.italic = true
    if (strike) frame.strike = true
    return frame
  }

  const emit = (text: string, extra: Frame = {}) => {
    if (!text) return
    const style = { ...effective(), ...extra }
    const previous = raw.at(-1)
    if (previous && sameStyle(previous, style)) previous.text += text
    else raw.push({ ...style, text })
  }

  const flush = () => {
    emit(buffer)
    buffer = ''
  }

  const legacyCode = (i: number): { length: number; apply: () => void } | undefined => {
    if (!options.legacy) return undefined
    const sigil = source[i]
    if (sigil !== '§' && sigil !== '&') return undefined
    if (sigil === '&') {
      const atBoundary = i === 0 || lastCodeEnd === i || !isWordChar(source[i - 1])
      if (!atBoundary || /^&(#\d+|[a-z]+);/i.test(source.slice(i))) return undefined
    }

    const hex = source.slice(i + 1).match(/^#([0-9a-fA-F]{6})/)
    if (hex) return { length: 8, apply: () => (legacy = { color: '#' + hex[1]!.toLowerCase() }) }

    const longHex = source.slice(i).match(new RegExp('^\\' + sigil + '[xX]((?:\\' + sigil + '[0-9a-fA-F]){6})'))
    if (longHex) {
      const color = '#' + longHex[1]!.split(sigil).join('').toLowerCase()
      return { length: longHex[0].length, apply: () => (legacy = { color }) }
    }

    const raw = source[i + 1]
    if (!raw) return undefined
    const code = sigil === '§' ? raw.toLowerCase() : raw
    const color = LEGACY_BY_CODE.get(code)
    if (color) return { length: 2, apply: () => (legacy = { color }) }
    const format = LEGACY_FORMATS[code]
    if (format) return { length: 2, apply: () => (legacy = { ...legacy, [format]: true }) }
    if (code === 'r') return { length: 2, apply: () => (legacy = {}) }
    return undefined
  }

  let i = 0
  while (i < source.length) {
    const char = source[i]
    const atLineStart = i === 0 || source[i - 1] === '\n'

    if (atLineStart && options.markdown) {
      const head = source.slice(i).match(/^#{1,6} /)
      const item = source.slice(i).match(/^(\s*)[-*+] (?=\S)/)
      const quote = source.slice(i).match(/^> ?/)
      if (head) {
        flush()
        heading = true
        i += head[0].length
        continue
      }
      if (item) {
        buffer += item[1] + '• '
        i += item[0].length
        continue
      }
      if (quote) {
        flush()
        emit('│ ', { dim: true })
        i += quote[0].length
        continue
      }
    }

    if (char === '\n') {
      flush()
      heading = false
      legacy = {}
      buffer = '\n'
      i += 1
      continue
    }

    if (char === '\\' && i + 1 < source.length && '{}§&*`~\\'.includes(source[i + 1]!)) {
      buffer += source[i + 1]
      i += 2
      continue
    }

    if (options.markdown && char === '`') {
      const end = source.indexOf('`', i + 1)
      if (end > i + 1) {
        flush()
        emit(source.slice(i + 1, end), { code: true })
        i = end + 1
        continue
      }
    }

    if (options.markdown && source.startsWith('**', i) && (bold || source.indexOf('**', i + 2) !== -1)) {
      flush()
      bold = !bold
      i += 2
      continue
    }

    if (options.markdown && source.startsWith('~~', i) && (strike || source.indexOf('~~', i + 2) !== -1)) {
      flush()
      strike = !strike
      i += 2
      continue
    }

    if (options.markdown && char === '*') {
      const opens = !italic && /\S/.test(source[i + 1] ?? ' ') && source.indexOf('*', i + 1) !== -1
      const closes = italic && /\S/.test(source[i - 1] ?? ' ')
      if (opens || closes) {
        flush()
        italic = !italic
        i += 1
        continue
      }
    }

    if (char === '{') {
      const tag = source.slice(i).match(/^\{(\/?)([^{}\n]{0,120})\}/)
      if (tag) {
        const [whole, closing, inner] = tag
        const name = (inner ?? '').trim()
        if (closing && (stack.length > 1 || name === '*')) {
          flush()
          if (name === '*') stack.splice(1)
          else stack.pop()
          hasMarkup = true
          i += whole.length
          continue
        }
        if (!closing && name === 'reset') {
          flush()
          stack.splice(1)
          legacy = {}
          hasMarkup = true
          i += whole.length
          continue
        }
        const frame = closing ? undefined : parseTag(name)
        if (frame) {
          flush()
          const merged: Frame = { ...stack.at(-1)!, ...frame }
          if (frame.color) delete merged.gradient
          if (frame.gradient) {
            delete merged.color
            merged.gradientId = ++gradientCount
          }
          stack.push(merged)
          hasMarkup = true
          i += whole.length
          continue
        }
      }
    }

    const code = legacyCode(i)
    if (code) {
      flush()
      code.apply()
      hasMarkup = true
      i += code.length
      lastCodeEnd = i
      continue
    }

    buffer += char
    i += 1
  }
  flush()

  return { runs: finish(raw), hasMarkup }
}

/** Spreads each gradient over its characters and drops the internal fields. */
const finish = (raw: RawRun[]): Run[] => {
  const lengths = new Map<number, number>()
  for (const run of raw) {
    if (run.gradientId) {
      const visible = run.text.replace(/\n/g, '').length
      lengths.set(run.gradientId, (lengths.get(run.gradientId) ?? 0) + visible)
    }
  }

  const seen = new Map<number, number>()
  const out: Run[] = []
  const push = (run: Run) => {
    const previous = out.at(-1)
    if (previous && sameStyle(previous, run)) previous.text += run.text
    else out.push(run)
  }

  for (const { gradient, gradientId, ...rest } of raw) {
    const run: Run = { ...rest, text: rest.obfuscated ? obfuscate(rest.text) : rest.text }
    if (!gradient || !gradientId) {
      push(run)
      continue
    }
    const total = lengths.get(gradientId) ?? 1
    for (const char of run.text) {
      if (char === '\n') {
        push({ ...run, text: char })
        continue
      }
      const index = seen.get(gradientId) ?? 0
      seen.set(gradientId, index + 1)
      push({ ...run, text: char, color: gradientAt(gradient, total > 1 ? index / (total - 1) : 0) })
    }
  }
  return out
}

const isTable = (paragraph: string) => paragraph.split('\n').every(line => line.trimStart().startsWith('|'))

const isClosingFence = (line: string, marker: string, fence: string) =>
  marker.startsWith(fence[0]!) && marker.length >= fence.length && !line.trim().slice(marker.length)

/** Splits text into fence-aware segments; an unclosed fence runs to the end. */
const segments = (text: string): { isFence: boolean; text: string }[] => {
  const out: { isFence: boolean; text: string }[] = []
  let fence: string | undefined
  let current: string[] = []

  const close = (isFence: boolean) => {
    if (current.length) out.push({ isFence, text: current.join('\n') })
    current = []
  }

  for (const line of text.split('\n')) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})/)
    if (!fence && marker) {
      close(false)
      fence = marker[1]
      current.push(line)
    } else if (fence && marker && isClosingFence(line, marker[1]!, fence)) {
      current.push(line)
      close(true)
      fence = undefined
    } else {
      current.push(line)
    }
  }
  close(!!fence)
  return out
}

/** Splits a reply into markdown blocks and styled blocks; code fences stay untouched. */
export const toBlocks = (text: string, options: FormatOptions = {}): Block[] => {
  const blocks: Block[] = []
  const addMarkdown = (part: string) => {
    const previous = blocks.at(-1)
    if (previous?.kind === 'markdown') previous.text += '\n\n' + part
    else blocks.push({ kind: 'markdown', text: part })
  }

  for (const segment of segments(text)) {
    if (segment.isFence) {
      addMarkdown(segment.text)
      continue
    }
    for (const part of segment.text.split(/\n{2,}/)) {
      const paragraph = part.replace(/^\n+|\n+$/g, '')
      if (!paragraph.trim()) continue
      if (isTable(paragraph)) {
        const plain = scan(paragraph, { ...options, markdown: false })
        addMarkdown(plain.hasMarkup ? plain.runs.map(run => run.text).join('') : paragraph)
        continue
      }
      const styled = scan(paragraph, { ...options, markdown: true })
      if (styled.hasMarkup) blocks.push({ kind: 'styled', runs: styled.runs })
      else addMarkdown(paragraph)
    }
  }
  return blocks
}

export const hasStyledBlock = (blocks: readonly Block[]) => blocks.some(block => block.kind === 'styled')

/** The instructions the model reads so it knows the syntax. */
export const guide = (options: FormatOptions = {}) =>
  [
    '# Colored output',
    'The terminal draws inline formatting tags in your replies.',
    `Colors: {red}text{/} with ${Object.keys(PALETTE).join(', ')}, a classic color name (gold, aqua, dark_red, ...) or hex ({#ff8800}text{/}).`,
    'Styles: {bold}, {italic}, {underline}, {strike}, {dim}, {inverse}; background {bg:blue}; combine in one tag: {bold red bg:black}.',
    `Gradients: {rainbow}text{/}, {gradient:#ff0000:#0000ff}text{/}, presets ${Object.keys(GRADIENTS).join(', ')} ({gradient:fire}).`,
    '{/} closes the last tag, {/*} closes all, {reset} clears everything. Escape a literal brace with a backslash.',
    options.legacy
      ? 'legacy codes also work: §a or &a for colors, §l bold, §o italic, §n underline, §m strike, §k obfuscated, §r reset, &#RRGGBB hex. Use them only when asked for legacy codes.'
      : '',
    'Use color to aid scanning (status words, key values, warnings), not on every sentence. Never inside code blocks or inline code. Tables are drawn without color.',
  ]
    .filter(Boolean)
    .join('\n')
