# Usage — @byhofman/spa-runtime-config

A utility for loading runtime configuration in Vite-based frontend applications. Configuration is fetched from static JSON files at runtime, allowing values to be changed per environment without rebuilding the application.

## Installation

```bash
npm install @byhofman/spa-runtime-config
```

## Configuration files

Place one or both files in your application's `public/` folder so they are served as static assets:

| File | Purpose |
|---|---|
| `public/application.config.json` | Base configuration |
| `public/application.config.local.json` | Local overrides (merged on top of base) |

Values in `application.config.local.json` take precedence over `application.config.json`. Both files are optional — a missing or unreachable file is silently ignored.

**Example `public/application.config.json`:**
```json
{
  "apiUrl": "https://api.example.com",
  "featureFlags": {
    "darkMode": false
  }
}
```

**Example `public/application.config.local.json`:**
```json
{
  "apiUrl": "https://api.local.example.com"
}
```

## API

### `getConfigurationValue<T>(key, basePath?)`

Fetches the configuration and returns the value at `key`. The result is cached in `sessionStorage` so subsequent calls do not trigger additional HTTP requests.

```ts
import { getConfigurationValue } from '@byhofman/spa-runtime-config'

// basePath defaults to '/'
const apiUrl = await getConfigurationValue<string>('apiUrl')

// Nested keys use dot notation
const darkMode = await getConfigurationValue<boolean>('featureFlags.darkMode')

// Provide basePath explicitly when the app is served from a sub-path
const apiUrl = await getConfigurationValue<string>('apiUrl', import.meta.env.BASE_URL)
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | — | Dot-notation path to the value (e.g. `"featureFlags.darkMode"`) |
| `basePath` | `string` | `'/'` | Base URL from which the config files are served. Override when the app is served from a sub-path. |

Throws an `Error` if the key does not exist in the merged configuration.

### `clearConfigCache(basePath?)`

Removes the cached configuration for the given `basePath` from `sessionStorage`. The next call to `getConfigurationValue` will re-fetch the config files.

```ts
import { clearConfigCache } from '@byhofman/spa-runtime-config'

// Uses the same default basePath as getConfigurationValue
clearConfigCache()

// Or specify explicitly
clearConfigCache(import.meta.env.BASE_URL)
```

Useful in tests or when configuration needs to be refreshed at runtime.

## Usage with Vue

A common pattern is to load configuration once before mounting the app:

```ts
// main.ts
import { createApp } from 'vue'
import { getConfigurationValue } from '@byhofman/spa-runtime-config'
import App from './App.vue'

const apiUrl = await getConfigurationValue<string>('apiUrl')

const app = createApp(App)
app.provide('apiUrl', apiUrl)
app.mount('#app')
```

## Caching behaviour

Configuration is stored in `sessionStorage` under the key `<basePath>-config`. The cache persists for the duration of the browser session. Call `clearConfigCache` to invalidate it manually.

## SSR

The library detects server-side rendering environments (`typeof window === 'undefined'`) and returns an empty configuration object. Key lookups in SSR context will throw unless defaults are handled by the caller.
