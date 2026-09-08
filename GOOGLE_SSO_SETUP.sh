#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT_DIR/backend/.env"
ENV_EXAMPLE="$ROOT_DIR/backend/.env.example"
DEFAULT_REDIRECT="http://localhost:4000/api/auth/google/callback"
DEFAULT_DOMAIN="iquritech.com"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Q BMS backend/.env was not found."
  echo "Expected: $ENV_FILE"
  exit 1
fi

read_env() {
  local key="$1"
  python3 - "$ENV_FILE" "$key" <<'PY'
import sys
from pathlib import Path
path=Path(sys.argv[1]); key=sys.argv[2]
for raw in path.read_text().splitlines():
    line=raw.strip()
    if line.startswith(key+'='):
        print(line.split('=',1)[1].strip().strip('"').strip("'"))
        break
PY
}

CURRENT_CLIENT_ID="$(read_env GOOGLE_OAUTH_CLIENT_ID || true)"
CURRENT_REDIRECT="$(read_env GOOGLE_OAUTH_REDIRECT_URI || true)"
CURRENT_DOMAIN="$(read_env GOOGLE_WORKSPACE_DOMAIN || true)"

printf '\nQ BMS — Google Workspace SSO Setup\n'
printf '%s\n' '----------------------------------'
printf 'OAuth type       : Web application\n'
printf 'Workspace domain : %s\n' "${CURRENT_DOMAIN:-$DEFAULT_DOMAIN}"
printf 'Redirect URI     : %s\n\n' "${CURRENT_REDIRECT:-$DEFAULT_REDIRECT}"
printf 'Google Cloud must provide the OAuth Client ID and Client Secret.\n'
printf 'The Client Secret is written only to backend/.env and is never printed back.\n\n'

read -r -p "Google OAuth Client ID${CURRENT_CLIENT_ID:+ [keep existing with Enter]}: " CLIENT_ID
if [[ -z "$CLIENT_ID" ]]; then CLIENT_ID="$CURRENT_CLIENT_ID"; fi
if [[ -z "$CLIENT_ID" ]]; then
  echo "Client ID is required. Nothing was changed."
  exit 2
fi

read -r -s -p "Google OAuth Client Secret [hidden]: " CLIENT_SECRET
echo
if [[ -z "$CLIENT_SECRET" ]]; then
  EXISTING_SECRET="$(read_env GOOGLE_OAUTH_CLIENT_SECRET || true)"
  CLIENT_SECRET="$EXISTING_SECRET"
fi
if [[ -z "$CLIENT_SECRET" ]]; then
  echo "Client Secret is required. Nothing was changed."
  exit 2
fi

read -r -p "Workspace Domain [${CURRENT_DOMAIN:-$DEFAULT_DOMAIN}]: " DOMAIN
DOMAIN="${DOMAIN:-${CURRENT_DOMAIN:-$DEFAULT_DOMAIN}}"
read -r -p "Redirect URI [${CURRENT_REDIRECT:-$DEFAULT_REDIRECT}]: " REDIRECT
REDIRECT="${REDIRECT:-${CURRENT_REDIRECT:-$DEFAULT_REDIRECT}}"

BACKUP="$ENV_FILE.backup-$(date +%Y%m%d-%H%M%S)"
cp "$ENV_FILE" "$BACKUP"

GOOGLE_CLIENT_ID="$CLIENT_ID" \
GOOGLE_CLIENT_SECRET="$CLIENT_SECRET" \
GOOGLE_DOMAIN="$DOMAIN" \
GOOGLE_REDIRECT="$REDIRECT" \
python3 - "$ENV_FILE" <<'PY'
import os, sys
from pathlib import Path
path=Path(sys.argv[1])
updates={
    'GOOGLE_OAUTH_CLIENT_ID': os.environ['GOOGLE_CLIENT_ID'].strip(),
    'GOOGLE_OAUTH_CLIENT_SECRET': os.environ['GOOGLE_CLIENT_SECRET'].strip(),
    'GOOGLE_OAUTH_REDIRECT_URI': os.environ['GOOGLE_REDIRECT'].strip(),
    'GOOGLE_WORKSPACE_DOMAIN': os.environ['GOOGLE_DOMAIN'].strip().lower(),
}
lines=path.read_text().splitlines()
seen=set(); out=[]
for raw in lines:
    stripped=raw.strip()
    replaced=False
    for key,value in updates.items():
        if stripped.startswith(key+'='):
            out.append(f'{key}={value}')
            seen.add(key); replaced=True; break
    if not replaced:
        out.append(raw)
if any(k not in seen for k in updates):
    out.append('')
    out.append('# Google Workspace SSO')
    for key,value in updates.items():
        if key not in seen:
            out.append(f'{key}={value}')
path.write_text('\n'.join(out).rstrip()+'\n')
PY

# Trigger node --watch backend reload without killing the terminal process.
if [[ -f "$ROOT_DIR/backend/src/core/auth/auth.google.js" ]]; then
  touch "$ROOT_DIR/backend/src/core/auth/auth.google.js"
fi

printf '\nSaved Google Workspace SSO configuration.\n'
printf 'Backup: %s\n' "$BACKUP"
printf 'Domain: %s\n' "$DOMAIN"
printf 'Redirect URI: %s\n' "$REDIRECT"
printf 'Client Secret: [stored securely in backend/.env]\n'
printf '\nIf the backend dev server is running with node --watch, it will reload automatically.\n'
