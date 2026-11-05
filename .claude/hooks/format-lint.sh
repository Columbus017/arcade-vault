#!/usr/bin/env bash
# PostToolUse hook: run every written/edited file through Prettier, then
# ESLint (--fix). Each tool skips file types it doesn't support.
# Exit 2 sends remaining ESLint errors back to Claude.

f=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty')
[ -z "$f" ] || [ ! -f "$f" ] && exit 0

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
case "$f" in
  "$root"/node_modules/* | "$root"/.next/*) exit 0 ;;
  "$root"/*) ;;
  *) exit 0 ;;
esac

cd "$root" || exit 0

./node_modules/.bin/prettier --write --ignore-unknown --log-level warn "$f" >&2

# Every file goes to ESLint; files no config matches are skipped silently.
# Runs after Prettier so blank lines in code (JS/TS) are stripped last.
no_blank='{"no-multiple-empty-lines":["error",{"max":0,"maxBOF":0,"maxEOF":0}]}'
if ! out=$(./node_modules/.bin/eslint --fix --no-warn-ignored --rule "$no_blank" "$f" 2>&1); then
  echo "ESLint errors in $f:" >&2
  echo "$out" >&2
  exit 2
fi

exit 0
