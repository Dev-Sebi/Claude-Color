/** What \`/colors demo\` shows: every feature drawn once. */
export const DEMO = [
  '{bold rainbow}Colored output{/}',
  '{green}✔ passed{/}  {red}✘ failed{/}  {yellow}⚠ warning{/}  {cyan}ℹ info{/}  {gray}skipped{/}',
  '{bold}bold{/} {italic}italic{/} {underline}underline{/} {strike}strike{/} {dim}dim{/} {inverse} inverse {/} {bold white bg:purple} badge {/}',
  '{gradient:fire}fire gradient{/}  {gradient:ocean}ocean gradient{/}  {gradient:sunset}sunset gradient{/}  {gradient:#ff0000:#0000ff}custom gradient{/}',
  '§6§l★ §e§lPIXEL ARCADE §6§l★ §r§7- §aOnline §7| §bShop §7| §dEvents',
  '&#ff5555Hex &#55ff55codes &#5555ffwork &ktoo&r §8(obfuscated)',
].join('\n\n')

/** What \`/colors\` shows: the syntax and how each piece looks. */
export const CHEAT_SHEET = [
  '{bold}Colored output: cheat sheet{/}',
  [
    '`{red}text{/}` → {red}text{/}   `{#ff8800}text{/}` → {#ff8800}text{/}   `{gold}text{/}` → {gold}text{/}',
    '`{bold}` {bold}bold{/}  `{italic}` {italic}italic{/}  `{underline}` {underline}underline{/}  `{strike}` {strike}strike{/}  `{dim}` {dim}dim{/}  `{inverse}` {inverse}inverse{/}',
    '`{bg:blue}` {bg:blue} background {/}   `{bold red bg:black}` {bold red bg:black} combined {/}',
    '`{rainbow}` {rainbow}rainbow{/}   `{gradient:fire}` {gradient:fire}fire{/}   `{gradient:#f00:#00f}` {gradient:#f00:#00f}custom{/}',
    '`{/}` closes the last tag, `{/*}` closes all, `{reset}` clears everything, `\\{` is a literal brace.',
    '`§a` / `&a` {#55ff55}legacy colors{/}, `§l` bold, `§o` italic, `§n` underline, `§m` strike, `§k` obfuscated, `§r` reset, `&#RRGGBB` hex.',
  ].join('\n'),
  '{dim}/colors demo shows everything at once. /colors off turns it off, /colors on back on.{/}',
].join('\n\n')
