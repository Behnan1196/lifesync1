# LifeSync Mobile Frame - Completion Report

## What Was Built

A complete **Expo (React Native + TypeScript)** mobile application frame that serves as the platform/chassis for LifeSync. This is a **frame-only** implementation with no actual tools.

### Core Features Implemented

1. **Authentication System**
   - Supabase email + password login
   - Session management (automatic via Supabase)
   - Last used email persisted to device (password never stored)
   - All authenticated users can login (role doesn't block access)

2. **Language Support**
   - Turkish (default) and English
   - Language selector on Login screen
   - Persisted to device storage via AsyncStorage
   - All UI text from i18n keys (zero hardcoded strings)

3. **Role System**
   - Reads `public.profiles` table for user role
   - Displays role in Profile screen
   - Fallback to 'user' if profile row missing
   - Role does NOT control login or tool visibility

4. **Entitlements System (Critical)**
   - Tool visibility controlled by Web backend API
   - Endpoint: `GET {EXPO_PUBLIC_WEB_BASE_URL}/api/entitlements/me`
   - Authorization via Bearer token (Supabase access token)
   - Default: empty tools array (no tools visible)
   - Frame NEVER hardcodes tool list
   - Frame NEVER includes SuperAdmin

5. **Navigation**
   - Bottom Tabs: Tools + Profile
   - Tools tab shows entitled tools as placeholder list
   - Profile tab shows email, role, settings, logout
   - No SuperAdmin UI (removed from frame)

6. **Error Handling**
   - EnvMissingScreen: Shows if required Supabase env vars missing
   - SetupIncompleteScreen: Shows if profiles table doesn't exist
   - Non-blocking banners for entitlements issues

## How Login Works

1. User enters email + password on LoginScreen
2. Language selector available (TR/EN) - persisted to device
3. Last used email loaded from AsyncStorage on mount
4. Supabase `signInWithPassword` called
5. On success:
   - Email saved to AsyncStorage
   - Session automatically persisted by Supabase
   - RootNavigator detects session change
6. On failure:
   - Alert shown with i18n error message
   - User remains on login screen

**Important:** Login is allowed for ALL authenticated users. Role is NOT checked during login.

## How Profiles Are Read and Role Displayed

1. After successful login, ProfileScreen mounts
2. Query: `SELECT role FROM public.profiles WHERE user_id = auth.uid()`
3. If profile exists:
   - Role displayed (admin/user)
   - Translated via i18n
4. If profile missing:
   - Role defaults to 'user'
   - Informational note shown: "Profile not found, showing default role."
5. Role is displayed but does NOT control:
   - Login access
   - Tool visibility (entitlements control this)

## SetupIncomplete Behavior

Triggered when `public.profiles` table cannot be read:

1. RootNavigator calls `checkSetup()` after login
2. Attempts: `SELECT user_id FROM public.profiles LIMIT 1`
3. If query fails (table missing, RLS blocks, etc.):
   - `setupComplete` set to false
   - SetupIncompleteScreen shown
4. Screen displays:
   - Title: "Setup Incomplete" (i18n)
   - Message: "DB bootstrap not applied (profiles missing)" (i18n)
5. User cannot proceed until database is properly bootstrapped

**Does NOT crash** - gracefully shows informational screen.

## Entitlements Behavior

### How Fetched

1. ToolsHomeScreen loads entitlements on focus/entry
2. Only if `EXPO_PUBLIC_WEB_BASE_URL` is configured
3. Calls: `GET {WEB_BASE_URL}/api/entitlements/me`
4. Headers: `Authorization: Bearer <access_token>`
5. Expected response:
   ```json
   {
     "tools": ["tool-key-1", "tool-key-2"],
     "source": "default" | "override"
   }
   ```

### Failure Fallback

If entitlements request fails (network error, 401, 403, 500, etc.):
- Tools array treated as empty: `[]`
- Non-blocking warning banner shown on Tools screen
- Banner message (i18n): "Tool visibility could not be loaded. Showing none."
- User can still navigate to Profile tab
- No crash or blocking error

### When EXPO_PUBLIC_WEB_BASE_URL is Missing

If `EXPO_PUBLIC_WEB_BASE_URL` is empty or not set:
- Entitlements fetching completely disabled
- Tools array treated as empty: `[]`
- Non-blocking banner shown on Tools screen
- Banner message (i18n): "Entitlements backend not configured. Showing none."
- This is expected behavior in early development
- User can still use Profile tab and logout

### Tool Placeholders

- Entitled tools shown as simple list on Tools screen
- Clicking any tool shows Alert: "Not installed in this build."
- No real tool functionality (frame only)
- No tool install/uninstall logic

## How to Run

### Prerequisites

1. Node.js and npm installed
2. Expo CLI (installed via npx)
3. iOS Simulator / Android Emulator / Expo Go app

### Steps

1. **Install dependencies:**
   ```bash
   cd apps/mobile
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Fill in required Supabase credentials:
     ```env
     EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```
   - Optionally add Web backend URL (only when entitlements backend exists):
     ```env
     EXPO_PUBLIC_WEB_BASE_URL=https://your-web-domain.com
     ```

3. **Ensure database is bootstrapped:**
   - `public.profiles` table must exist
   - Schema:
     ```sql
     CREATE TABLE public.profiles (
       user_id uuid PRIMARY KEY REFERENCES auth.users(id),
       role text NOT NULL CHECK (role IN ('admin', 'user')),
       created_at timestamptz DEFAULT now()
     );
     ```

4. **Start Expo:**
   ```bash
   npm start
   ```

5. **Run on device/simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## Known Limitations

1. **No Actual Tools**
   - This is a frame-only implementation
   - Tool list shows placeholders that don't open real functionality
   - Clicking a tool shows "Not installed in this build."

2. **No Database Writes**
   - App only reads from `public.profiles`
   - No insert/update/delete operations
   - Profiles managed manually via SQL outside the app

3. **No Tool Management**
   - No tool install/uninstall logic
   - No tool-specific screens or routes
   - No tool CRUD flows

4. **No SuperAdmin UI**
   - Admin Console Lite removed from frame
   - SuperAdmin functionality moved to optional tool
   - No organization management
   - No user invite flows
   - No entitlements admin UI

5. **Entitlements Backend Optional**
   - Early development can proceed without Web backend
   - Tools will show as empty with informational banner
   - Backend required for production tool visibility

## Technical Stack

- **Expo SDK:** 54
- **React Native:** 0.76.5
- **React:** 18.3.1
- **Navigation:** @react-navigation/native + bottom-tabs
- **Auth:** @supabase/supabase-js
- **Storage:** @react-native-async-storage/async-storage
- **TypeScript:** 5.3.3

## Files Created

Total: 30+ files across the following structure:

- Core: env.ts, supabase.ts, http.ts
- Auth: LoginScreen.tsx, SetupIncompleteScreen.tsx, EnvMissingScreen.tsx, session.ts
- i18n: tr.ts, en.ts, i18n.ts, useI18n.ts
- Storage: kv.ts
- Navigation: RootNavigator.tsx, BottomTabs.tsx
- Tools: ToolsHomeScreen.tsx, entitlements.ts
- Profile: ProfileScreen.tsx, SettingsSection.tsx
- UI Components: Screen.tsx, Button.tsx, TextField.tsx, ListRow.tsx, NoticeBanner.tsx
- Theme: theme.ts
- Config: package.json, app.json, babel.config.js, tsconfig.json, .env.example, .gitignore

## Compliance with Requirements

✅ Expo SDK 54  
✅ Monorepo structure at `apps/mobile`  
✅ Supabase Auth (email + password)  
✅ Language selector on Login (TR default + EN)  
✅ Persisted language on device  
✅ Persisted last email (never password)  
✅ Reads role from `public.profiles`  
✅ Fetches tool visibility from Entitlements API  
✅ Bottom Tabs: Tools + Profile  
✅ Tools tab shows entitled tools as placeholders  
✅ Profile includes Settings (language change)  
✅ No database changes  
✅ No SQL, migrations, RLS, policies, or RPCs  
✅ No tool install/uninstall logic  
✅ No tool-specific screens  
✅ No global stores (only React Context for auth + i18n)  
✅ All UI text from i18n keys  
✅ SuperAdmin removed from frame  
✅ Graceful handling when Web backend not configured  
✅ SetupIncomplete screen when profiles missing  

## Ready for Next Steps

The frame is complete and ready for:
1. Tool-specific implementations (separate prompts)
2. Entitlements backend configuration
3. Database bootstrap with profiles table
4. Production deployment configuration

No uninstall instructions needed (frame has none).
