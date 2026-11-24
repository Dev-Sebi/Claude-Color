import { DEMO } from '../hooks/samples.ts'

export type Example = { file: string; title: string; source: string; isSourceShown: boolean }

export const EXAMPLES: Example[] = [
  {
    file: 'hero',
    title: 'claude-color',
    isSourceShown: false,
    source: DEMO,
  },
  {
    file: 'status',
    title: 'claude-color: status summary',
    isSourceShown: true,
    source: [
      '{bold}Deploy report{/}',
      '- Build: {green}✔ passed{/} in {cyan}42s{/}',
      '- Tests: {green}128 passed{/}, {red}2 failed{/}, {gray}5 skipped{/}',
      '- Coverage: {yellow}78%{/} {dim}(target 80%){/}',
      '- Status: {bold white bg:red} BLOCKED {/}',
    ].join('\n'),
  },
  {
    file: 'styles',
    title: 'claude-color: colors and styles',
    isSourceShown: true,
    source: [
      '{red}red{/} {orange}orange{/} {yellow}yellow{/} {green}green{/} {teal}teal{/}',
      '{cyan}cyan{/} {blue}blue{/} {purple}purple{/} {pink}pink{/} {gray}gray{/}',
      '{bold}bold{/} {italic}italic{/} {underline}underline{/} {strike}strike{/} {dim}dim{/} {inverse} inverse {/}',
      '{#ff8800}hex #ff8800{/} {bg:blue} background {/} {bold yellow bg:#3b0764} combined {/}',
    ].join('\n'),
  },
  {
    file: 'gradients',
    title: 'claude-color: gradients',
    isSourceShown: true,
    source: [
      '{bold rainbow}Rainbow headline across the whole line{/}',
      '{gradient:fire}fire{/} {gradient:ocean}ocean{/} {gradient:sunset}sunset{/} {gradient:mint}mint{/} {gradient:mono}mono{/}',
      '{gradient:#ff0000:#ffff00:#00ff00}custom three-stop gradient{/}',
    ].join('\n'),
  },
  {
    file: 'banner',
    title: 'claude-color: server banner',
    isSourceShown: true,
    source: [
      '§6§l★ §e§lPIXEL ARCADE §6§l★ §r§8[§av2.4§8]',
      '§7» §aOnline §8| §bShop §8| §dEvents §8| §c§lSupport',
      '&#ff5555Hex &#ffaa00color &#55ff55codes &r&7and §kmagic§r §7text',
    ].join('\n'),
  },
  {
    file: 'markdown',
    title: 'claude-color: markdown stays markdown',
    isSourceShown: true,
    source: [
      '# Release {green}v2.1{/}',
      '- **Fixed** login on {cyan}Safari{/}',
      '- *Removed* the {strike}legacy{/} endpoint',
      '',
      '```ts',
      "const tag = '{red}not colored inside code{/}'",
      '```',
    ].join('\n'),
  },
]
