#!/bin/bash
# Stop hook: when Claude finishes a turn (session goes idle), commit any
# changes and push them to the current branch so cloud-session work survives
# the container being reclaimed. Never touches main/master or a detached HEAD.
# .gitignore already keeps compiled PDFs, salary data, .env, photos etc. out.
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0
case "$branch" in main|master|HEAD) exit 0 ;; esac

git add -A
if ! git diff --cached --quiet; then
  files=$(git diff --cached --name-only | head -5 | paste -sd, -)
  git commit -q -m "Auto-save: ${files}" \
    -m "Committed automatically by the Stop hook (.claude/hooks/auto-commit.sh)." || exit 0
fi

# Push only if there is something the remote doesn't have yet.
if ! git rev-parse --verify -q '@{u}' >/dev/null || [ -n "$(git log '@{u}..' --oneline)" ]; then
  for delay in 2 4 8 16; do
    git push -q -u origin "$branch" 2>/dev/null && exit 0
    sleep "$delay"
  done
  echo '{"systemMessage": "Auto-commit hook: push failed; changes are committed locally."}'
fi
exit 0
