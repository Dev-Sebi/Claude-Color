import type { ElementTable, Register } from 'claude-code'

import { guide, hasStyledBlock, toBlocks } from './format'
import type { Block, Run } from './format'
import { CHEAT_SHEET, DEMO } from './samples'

const COMMAND = 'color'
const ENABLED_KEY = 'enabled'

function draw(elements: ElementTable, blocks: Block[]) {
  const { Box, Text, Markdown } = elements
  const runText = (run: Run) => (
    <Text
      color={run.color ?? (run.code ? 'permission' : undefined)}
      backgroundColor={run.bg}
      bold={run.bold}
      italic={run.italic}
      underline={run.underline}
      strikethrough={run.strike}
      dimColor={run.dim}
      inverse={run.inverse}
    >
      {run.text}
    </Text>
  )

  return (
    <Box flexDirection="column" gap={1}>
      {blocks.map(block =>
        block.kind === 'markdown' ? <Markdown text={block.text} /> : <Text>{block.runs.map(runText)}</Text>,
      )}
    </Box>
  )
}

const isOwnCommand = (command: string) => command === COMMAND || command.endsWith(':' + COMMAND)

export const register: Register = (on, options) => {
  const formatOptions = { legacy: options.legacyCodes !== false }
  const teachModel = options.teachModel !== false
  let isEnabled = true

  on('session.start', async ($, e, next) => {
    isEnabled = (await $.store.get(ENABLED_KEY)) !== false
    await $.command.register({
      name: COMMAND,
      description: 'Colored output: cheat sheet, demo, on or off',
      argumentHint: '[help|demo|on|off]',
    })
    return next(e)
  })

  on('prompt.submit', ($, e, next) => {
    if (!isEnabled || !teachModel) return next(e)
    return next({ ...e, context: [...(e.context ?? []), guide(formatOptions)] })
  }).catch(($, e, next) => next(e))

  on('command.run', { command: COMMAND }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()

    if (arg === 'on' || arg === 'off') {
      isEnabled = arg === 'on'
      await $.store.set(ENABLED_KEY, isEnabled)
      return { text: isEnabled ? '{green}Colored output is on.{/}' : 'Colored output is off.', isTextDisplayOnly: true }
    }
    if (arg === 'demo') return { text: DEMO, isTextDisplayOnly: true }
    return { text: CHEAT_SHEET, isTextDisplayOnly: true }
  })

  on('ui.render', { component: 'CommandOutput' }, async ($, e, next) => {
    if (!isOwnCommand(e.props.command)) return next(e)
    const blocks = toBlocks(e.props.text, formatOptions)
    return hasStyledBlock(blocks) ? draw($.ui.resolve(e), blocks) : next(e)
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (!isEnabled || e.props.isSummary) return next(e)
    const blocks = toBlocks(e.props.text, formatOptions)
    return hasStyledBlock(blocks) ? draw($.ui.resolve(e), blocks) : next(e)
  })
}
