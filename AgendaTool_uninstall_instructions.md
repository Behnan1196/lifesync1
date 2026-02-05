# Agenda Tool Uninstall Instructions

This guide provides steps to remove the Agenda tool from the LifeSync Web Workbench.

## 1. UI Removal
To remove the Agenda tool from the interface:
1.  Open `src/workbench/PanelResolver.tsx` and remove the `import AgendaPanel` and the `if (toolId === 'agenda')` block.
2.  Open `src/workbench/registry.ts` and remove the `agenda` entry from `TOOLS_REGISTRY` and `ASSIGNABLE_TOOLS`.
3.  (Optional) Delete the `src/tools/agenda/` directory.

## 2. Local Storage Cleanup
The Agenda tool uses a local cache for the Personal Agenda project ID to improve performance.
-   Key: `ls_personal_agenda_[USER_ID]`
-   Action: Clear browser local storage or programmatically call `localStorage.removeItem()` for this key.

## 3. Data Integrity Statement
**Agenda uninstall does NOT touch database schema or PM data.**
-   The "Personal Agenda" project (with title `personal_agenda`) and its items remain in the database for consistency with the mobile app and PM tool.
-   No tables, columns, or RPCs were created during the installation of this tool.
