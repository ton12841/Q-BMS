Q BMS v2.0.4.0 FRONTEND REPAIR

Cause:
The frontend folder was replaced instead of merged, so the Next.js project root files
(package.json, tsconfig.json, next.config.mjs, etc.) were removed.

Copy the CONTENTS of this repair folder into:
  /Users/ton/Development/Q BMS/frontend

Do NOT replace the whole frontend folder again.

Then run from the frontend folder:
  npm install
  rm -rf .next
  npm run dev

This repair also restores src/app/layout.tsx and the current transparent Q BMS logo.
