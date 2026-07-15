import axios from 'axios'

type Config = Record<string, unknown>

const SESSION_KEY_SUFFIX = '-config'

export async function getConfigurationValue<T>(key: string, basePath: string = '/'): Promise<T> {
    const config = await loadAppConfiguration(basePath)
    const value = getDeep(config, key)

    if (value === undefined) {
        throw new Error(`Key does not exist in AppConfiguration: ${key}`)
    }

    return value as T
}

export function clearConfigCache(basePath: string = '/'): void {
    sessionStorage.removeItem(`${basePath}${SESSION_KEY_SUFFIX}`)
}

function getDeep(obj: Config, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, key) => {
        if (acc !== null && typeof acc === 'object' && key in acc) {
            return (acc as Config)[key]
        }
        return undefined
    }, obj)
}

async function loadAppConfiguration(basePath: string): Promise<Config> {
    const cached = appConfigurationFromSession(basePath)
    if (cached !== null) {
        return cached
    }

    if (typeof window === 'undefined') {
        return {}
    }

    const config: Config = {
        ...(await loadOptionalConfig('application.config.json', basePath)),
        ...(await loadOptionalConfig('application.config.local.json', basePath)),
    }

    saveAppConfigurationToSession(config, basePath)
    return config
}

async function loadOptionalConfig(fileName: string, basePath: string): Promise<Config> {
    try {
        const response = await axios.get<Config>(`${basePath}/${fileName}`, {
            headers: { 'Content-Type': 'application/json' },
        })

        const contentType = response.headers['content-type'] as string | undefined
        if (!contentType?.includes('application/json')) {
            console.warn(`Invalid Content-Type for ${fileName}:`, contentType)
            return {}
        }

        return response.data ?? {}
    } catch (error) {
        console.error(`Error fetching configuration file ${fileName}`, error)
        return {}
    }
}

function appConfigurationFromSession(basePath: string): Config | null {
    const raw = sessionStorage.getItem(`${basePath}${SESSION_KEY_SUFFIX}`)
    if (raw === null) {
        return null
    }
    return JSON.parse(raw) as Config
}

function saveAppConfigurationToSession(config: Config, basePath: string): void {
    sessionStorage.setItem(`${basePath}${SESSION_KEY_SUFFIX}`, JSON.stringify(config))
}
