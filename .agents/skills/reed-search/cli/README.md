# reed-cli

Search Reed.co.uk (UK) job listings from the command line. Zero runtime dependencies;
`bun install` only pulls TypeScript types for `typecheck`.

```bash
bun run src/cli.ts search -q "embedded linux" --jobage 14 --format table
bun run src/cli.ts search -q "devops" -l "Bristol" --jobage 7 --page 2
bun run src/cli.ts detail 57340750 --format plain
```

```bash
bun install          # dev types only
bun run typecheck
bun run test         # unit tests plus one live search
```

Personal use only; keep volume low. See `../SKILL.md` for flags and `../url-reference.md`
for the endpoints, robots.txt constraints, and parsing anchors.
