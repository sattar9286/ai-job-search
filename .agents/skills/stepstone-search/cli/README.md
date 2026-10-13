# stepstone-cli

Search StepStone Austria and Belgium job listings from the command line. Zero runtime
dependencies; `bun install` only pulls TypeScript types for `typecheck`.

```bash
bun run src/cli.ts search -q "embedded linux" -l "Wien" --jobage 14 --format table
bun run src/cli.ts search -q "devops" -m be --format json
bun run src/cli.ts detail "<job-ad url from search>" --format plain
```

```bash
bun install          # dev types only
bun run typecheck
bun run test         # unit tests plus one live search
```

Personal use only; keep volume low. See `../SKILL.md` for flags and `../url-reference.md`
for the endpoints, robots.txt constraints, and parsing anchors.
