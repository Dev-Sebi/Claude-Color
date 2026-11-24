import { expect, test } from 'claude-code/testing'

const message = (text: string, surface: 'terminal' | 'desktop') =>
  ({
    plugin: 'claude-color',
    component: 'AssistantMessage',
    props: { text, isFirstOfReply: true },
    surface,
  }) as const

for (const surface of ['terminal', 'desktop'] as const) {
  test(`a tagged reply draws colored runs on ${surface}`, async $ => {
    const ui = await $.ui.mount(message('Build {green}passed{/}, lint {red}**failed**{/}.', surface))

    expect((await ui.find({ type: 'Text', text: /^passed$/ }))?.props.color).toBe('#30a46c')
    const failed = await ui.find({ type: 'Text', text: /^failed$/ })
    expect(failed?.props.color).toBe('#e5484d')
    expect(failed?.props.bold).toBe(true)
    await ui.unmount()
  })

  test(`a reply without markup goes to the engine on ${surface}`, async ($, on) => {
    on('ui.render', ($, e) => {
      const { Text } = $.ui.resolve(e)
      return <Text>engine</Text>
    })

    const ui = await $.ui.mount(message('plain **reply** with R&D', surface))
    expect((await ui.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine')
    await ui.unmount()
  })
}

test('a prompt carries the syntax guide', async ($, on) => {
  let context: readonly string[] = []
  on('prompt.submit', (_, e) => {
    context = e.context ?? []
    return { text: e.text }
  })

  await $.prompt.submit({ text: 'hello', origin: { kind: 'composer' }, wait: false })
  expect(context.some(entry => entry.includes('{red}text{/}'))).toBe(true)
})

test('the guide can be switched off', { options: { teachModel: false } }, async ($, on) => {
  let context: readonly string[] = []
  on('prompt.submit', (_, e) => {
    context = e.context ?? []
    return { text: e.text }
  })

  await $.prompt.submit({ text: 'hello', origin: { kind: 'composer' }, wait: false })
  expect(context.length).toBe(0)
})
