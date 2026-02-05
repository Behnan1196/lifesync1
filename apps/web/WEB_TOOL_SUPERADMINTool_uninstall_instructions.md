# WEB_TOOL_SUPERADMINTool_uninstall_instructions.md

## 1. UI Panel Removal
- Go to `src/workbench/registry.ts` and remove the `superadmin` entry from `TOOLS_REGISTRY`.
- Go to `src/workbench/PanelResolver.tsx`, remove the `SuperAdminPanel` import and the `if (toolId === 'superadmin')` block.
- Delete the directory `src/tools/superadmin`.

## 2. API Routes Removal
- Delete the following directories under `src/app/api`:
  - `src/app/api/admin` (entire directory)
- Revert changes to `src/app/api/entitlements/me/route.ts` if you want to go back to DB-based entitlement fetching (though DB-less is safer given current constraints).

## 3. Storage & Config Removal
- Delete `src/server/entitlements.store.json`.
- Delete `src/lib/admin.ts`.
- Delete `src/lib/supabaseService.ts`.
- Delete `src/lib/entitlements.ts`.
- Remove `SUPABASE_SERVICE_ROLE_KEY` and `LIFESYNC_SUPERADMIN_EMAILS` from your environment variables.

## 4. I18n Removal
- Remove the `superadmin` block and `tool.superadmin` key from:
  - `src/i18n/en.ts`
  - `src/i18n/tr.ts`
  - Remove any `common` keys introduced (save, cancel, etc.) if they aren't used elsewhere.
