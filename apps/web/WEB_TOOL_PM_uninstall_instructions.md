# PM Tool Uninstall Instructions

To completely remove the Project Management (PM) tool from the LifeSync Web application, follow these steps:

### 1. Delete Tool Files
Remove the entire PM tool directory:
- `rm -rf src/tools/pm`

### 2. Unregister from PanelResolver
Edit `src/workbench/PanelResolver.tsx`:
- Remove the import: `import PMPanel from '@/tools/pm/PMPanel';`
- Remove the `if (toolId === 'pm')` case.

### 3. Remove from Registry
Edit `src/workbench/registry.ts`:
- Remove the `pm` entry from `TOOLS_REGISTRY`.
- Remove `'pm'` from `ASSIGNABLE_TOOLS`.

### 4. Remove Translation Keys
Edit `src/i18n/en.ts` and `src/i18n/tr.ts`:
- Remove the `pm` key under the `tool` object.

### 5. Final Cleanup
- Search the codebase for references to `pm` or `Project Management` to ensure no accidental lingering imports remain.
- Restart the development server (`npm run dev`).
