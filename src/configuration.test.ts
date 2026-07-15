import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { getConfigurationValue, clearConfigCache } from './configuration'

vi.mock('axios')

const BASE_PATH = '/config'

function mockAxiosResponse(data: Record<string, unknown>, contentType = 'application/json') {
    vi.mocked(axios.get).mockResolvedValue({
        data,
        headers: { 'content-type': contentType },
        status: 200,
        statusText: 'OK',
        config: {},
    })
}

beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
})

describe('getConfigurationValue', () => {
    it('returns a top-level value', async () => {
        mockAxiosResponse({ apiUrl: 'https://example.com' })

        const result = await getConfigurationValue<string>('apiUrl', BASE_PATH)

        expect(result).toBe('https://example.com')
    })

    it('returns a nested value via dot notation', async () => {
        mockAxiosResponse({ database: { host: 'localhost', port: 5432 } })

        const result = await getConfigurationValue<number>('database.port', BASE_PATH)

        expect(result).toBe(5432)
    })

    it('throws when key does not exist', async () => {
        mockAxiosResponse({ apiUrl: 'https://example.com' })

        await expect(getConfigurationValue('missing.key', BASE_PATH)).rejects.toThrow(
            'Key does not exist in AppConfiguration: missing.key'
        )
    })

    it('merges application.config.local.json over application.config.json', async () => {
        vi.mocked(axios.get)
            .mockResolvedValueOnce({
                data: { apiUrl: 'https://prod.example.com', timeout: 3000 },
                headers: { 'content-type': 'application/json' },
                status: 200,
                statusText: 'OK',
                config: {},
            })
            .mockResolvedValueOnce({
                data: { apiUrl: 'https://local.example.com' },
                headers: { 'content-type': 'application/json' },
                status: 200,
                statusText: 'OK',
                config: {},
            })

        const apiUrl = await getConfigurationValue<string>('apiUrl', BASE_PATH)
        const timeout = await getConfigurationValue<number>('timeout', BASE_PATH)

        expect(apiUrl).toBe('https://local.example.com')
        expect(timeout).toBe(3000)
    })

    it('uses session cache on subsequent calls', async () => {
        mockAxiosResponse({ apiUrl: 'https://example.com' })

        await getConfigurationValue<string>('apiUrl', BASE_PATH)
        await getConfigurationValue<string>('apiUrl', BASE_PATH)

        expect(axios.get).toHaveBeenCalledTimes(2) // one per config file, not per call
    })

    it('returns empty config and does not throw when axios errors', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.mocked(axios.get).mockRejectedValue(new Error('Network error'))

        await expect(getConfigurationValue('anyKey', BASE_PATH)).rejects.toThrow(
            'Key does not exist in AppConfiguration: anyKey'
        )
    })

    it('ignores a config file that returns non-json content-type', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.mocked(axios.get).mockResolvedValue({
            data: '<html>404</html>',
            headers: { 'content-type': 'text/html' },
            status: 200,
            statusText: 'OK',
            config: {},
        })

        await expect(getConfigurationValue('anyKey', BASE_PATH)).rejects.toThrow(
            'Key does not exist in AppConfiguration: anyKey'
        )
    })
})

describe('clearConfigCache', () => {
    it('forces a re-fetch after clearing the cache', async () => {
        mockAxiosResponse({ apiUrl: 'https://example.com' })

        await getConfigurationValue<string>('apiUrl', BASE_PATH)

        clearConfigCache(BASE_PATH)
        await getConfigurationValue<string>('apiUrl', BASE_PATH)

        expect(axios.get).toHaveBeenCalledTimes(4) // 2 files × 2 fetches
    })

    it('does not affect cache for a different basePath', async () => {
        mockAxiosResponse({ apiUrl: 'https://example.com' })

        await getConfigurationValue<string>('apiUrl', BASE_PATH)
        clearConfigCache('/other')
        await getConfigurationValue<string>('apiUrl', BASE_PATH)

        expect(axios.get).toHaveBeenCalledTimes(2) // still cached
    })
})
