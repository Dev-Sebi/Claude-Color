# Contributing

Thanks for helping out. Bug reports, ideas and pull requests are welcome.

## Reporting a bug

Open an issue with:

1. The reply text that rendered wrong (copy it with `ctrl+o`)
2. What you expected and what you saw
3. Your Claude Code version (`claude --version`) and terminal

## Pull requests

1. Fork the repository and create a branch: `feature/<short-name>` or `bugfix/<short-name>`
2. Keep the parser in `hooks/format.ts` pure: no engine calls, text in, runs out
3. Add or update tests in `hooks/*.test.ts`
4. Run the checks:

   ```bash
   claude plugin validate .
   claude plugin test .
   ```

5. If the output changed, regenerate the images: `node scripts/render-examples.ts`
6. Add a line to `CHANGELOG.md` under an `Unreleased` heading

## Style

- TypeScript, two-space indent, no semicolons, single quotes
- Short comments only where the code does not explain itself
