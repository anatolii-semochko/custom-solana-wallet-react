import { useContext } from 'react'
import ConfigContext from '../context/ConfigContext.js'
import defaultConfig from '../config.json'

/**
 * Get configuration values
 * If used within React component tree with ConfigContext, returns merged config
 * Otherwise returns default config (fallback for non-React usage)
 */
export const getConfig = () => {
    // Try to get config from React context first
    try {
        return useContext(ConfigContext)
    } catch (error) {
        // Fallback to default config if not in React context
        return defaultConfig
    }
}

/**
 * Get specific config value with fallback
 * @param {string} key - Config key to retrieve
 * @param {any} fallback - Fallback value if key not found
 */
export const getConfigValue = (key, fallback = null) => {
    const config = getConfig()
    return config[key] ?? fallback
}

/**
 * Non-React hook version for use outside components
 * This should be set by the ConfigProvider when config changes
 */
let runtimeConfig = defaultConfig

export const setRuntimeConfig = (config) => {
    runtimeConfig = { ...defaultConfig, ...config }
}

export const getRuntimeConfig = () => runtimeConfig

/**
 * Safe config getter that works both in React and non-React contexts
 */
export const safeGetConfig = () => {
    // In non-React environments or class components, use runtime config
    if (typeof window !== 'undefined' && window.__SEVENS_WALLET_CONFIG__) {
        return window.__SEVENS_WALLET_CONFIG__
    }
    return runtimeConfig
}