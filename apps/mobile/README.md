# LifeSync Mobile Frame

The LifeSync Mobile Frame is a React Native (Expo) application that provides the platform/chassis for tool-based functionality. This is the **frame only** - no actual tools are implemented.

## Architecture

- **Expo SDK 54** with React Native + TypeScript
- **Supabase Auth** for authentication
- **Entitlements-first** tool visibility (no hardcoded tools)
- **i18n** support (Turkish default, English available)
- **Bottom Tab Navigation**: Tools + Profile

## Key Features

### Authentication
- Email + password login via Supabase
- Persists last used email (never stores password)
- Session managed automatically by Supabase
- All authenticated users can login (role doesn't block access)

### Language Support
- Turkish (default) and English
- Language selector on Login screen
- Persisted to device storage
- All UI text from i18n keys (no hardcoded strings)

### Role System
- Reads `public.profiles` table for user role
- Role displayed in Profile screen
- Fallback to 'user' if profile missing
- Role does NOT control login or tool visibility

### Entitlements System
- Tool visibility controlled by Web backend API
- Endpoint: `GET {EXPO_PUBLIC_WEB_BASE_URL}/api/entitlements/me`
- Returns: `{ tools: string[], source: 'default' | 'override' }`
- Default: empty tools array (no tools visible)
- Graceful degradation if backend not configured

### Navigation
- **Tools Tab**: Shows entitled tools as placeholder list
- **Profile Tab**: Email, role, settings, logout
- No SuperAdmin UI (removed from frame)
- No tool-specific screens

## Setup

### 1. Install Dependencies

```bash
cd apps/mobile
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in:

```env
# Required
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional (only needed when entitlements backend exists)
EXPO_PUBLIC_WEB_BASE_URL=https://your-web-domain.com
```

**Important:**
- Never commit `.env` with real secrets
- Never include service role key in mobile
- `EXPO_PUBLIC_WEB_BASE_URL` is optional in early dev

### 3. Database Prerequisites

The app expects `public.profiles` table to exist:

```sql
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  role text NOT NULL CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now()
);
```

If this table is missing, the app shows a **SetupIncomplete** screen.

### 4. Run the App

```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

## Behavior

### When EXPO_PUBLIC_WEB_BASE_URL is Missing
- Entitlements fetching disabled
- Tools array treated as empty
- Non-blocking banner shown on Tools screen: "Entitlements backend not configured. Showing none."

### When Entitlements Request Fails
- Network error, 401, 403, etc.
- Tools array treated as empty
- Non-blocking warning banner: "Tool visibility could not be loaded. Showing none."

### When Profiles Table Missing
- Shows **SetupIncomplete** screen
- Message: "DB bootstrap not applied (profiles missing)"
- Does NOT crash

### Tool Placeholders
- Entitled tools shown as simple list
- Clicking a tool shows: "Not installed in this build."
- No real tool functionality (frame only)

## What's NOT Included

This frame does NOT implement:
- ❌ Actual tools or tool-specific screens
- ❌ Tool install/uninstall logic
- ❌ SuperAdmin / Admin Console Lite
- ❌ Organization management
- ❌ User invite flows
- ❌ Entitlements admin UI
- ❌ Database migrations or SQL
- ❌ Global state stores

## Project Structure

```
apps/mobile/
├── src/
│   ├── App.tsx                    # Root component
│   ├── core/
│   │   ├── env.ts                 # Environment validation
│   │   ├── supabase.ts            # Supabase client
│   │   └── http.ts                # Fetch helpers with Bearer token
│   ├── auth/
│   │   ├── session.ts             # Session context
│   │   ├── LoginScreen.tsx        # Login with language selector
│   │   ├── SetupIncompleteScreen.tsx
│   │   └── EnvMissingScreen.tsx
│   ├── i18n/
│   │   ├── i18n.ts                # Language types
│   │   ├── tr.ts                  # Turkish translations
│   │   ├── en.ts                  # English translations
│   │   └── useI18n.ts             # i18n hook
│   ├── storage/
│   │   └── kv.ts                  # AsyncStorage helpers
│   ├── navigation/
│   │   ├── RootNavigator.tsx      # Auth flow + setup check
│   │   └── BottomTabs.tsx         # Tools + Profile tabs
│   ├── tools/
│   │   ├── ToolsHomeScreen.tsx    # Tool launcher (placeholders)
│   │   └── entitlements.ts        # Entitlements API client
│   ├── profile/
│   │   ├── ProfileScreen.tsx      # Email, role, logout
│   │   └── SettingsSection.tsx    # Language change
│   ├── ui/
│   │   └── components/
│   │       ├── Screen.tsx
│   │       ├── Button.tsx
│   │       ├── TextField.tsx
│   │       ├── ListRow.tsx
│   │       └── NoticeBanner.tsx
│   └── theme/
│       └── theme.ts               # Colors, spacing
├── .env.example
├── .gitignore
├── package.json
├── app.json
├── babel.config.js
├── tsconfig.json
└── README.md
```

## Known Limitations

- No actual tools implemented (frame only)
- Tool list shows placeholders that don't open real functionality
- No database write operations
- No tool installation/uninstallation
- SuperAdmin functionality moved to separate optional tool

## Next Steps

To add actual tools:
1. Implement tool-specific screens in separate tool folders
2. Configure entitlements backend to return tool keys
3. Update tool launcher to route to real tool screens
4. Follow tool-specific prompts under `docs/20_APP_MOBILE/`
