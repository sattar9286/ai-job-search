# hellowork-cli

Search Hellowork (France) job listings from the command line. Zero runtime dependencies;
`bun install` only pulls TypeScript types for `typecheck`.

```bash
bun run src/cli.ts search -q "devops" --format table
bun run src/cli.ts detail <id or url from search> --format plain
```

```bash
bun install          # dev types only
bun run typecheck
bun run test         # unit tests plus one live search
```

Personal use only; keep volume low. See `../SKILL.md` for flags and `../url-reference.md`
for the endpoints, robots.txt constraints, and parsing anchors.
