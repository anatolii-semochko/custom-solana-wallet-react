import React, { createContext, useContext } from 'react'
import defaultConfig from '../config.json'

const ConfigContext = createContext(defaultConfig)

/**
 * Configuration Provider that allows external configuration override
 * Usage:
 * <SevensWalletConfigProvider config={customConfig}>
 *   <YourApp />
 * </SevensWalletConfigProvider>
 */
export const SevensWalletConfigProvider = ({ children, config = {} }) => {
    const mergedConfig = {
        ...defaultConfig,
        ...config,
        // Deep merge for nested objects
        CONNECTION_ENDPOINTS: {
            ...defaultConfig.CONNECTION_ENDPOINTS,
            ...config.CONNECTION_ENDPOINTS
        },
        LANGUAGES: {
            ...defaultConfig.LANGUAGES,
            ...config.LANGUAGES
        }
    }

    return (
        <ConfigContext.Provider value={mergedConfig}>
            {children}
        </ConfigContext.Provider>
    )
}

/**
 * Hook to access wallet configuration
 * Returns the merged configuration (default + custom overrides)
 */
export const useWalletConfig = () => {
    const config = useContext(ConfigContext)

    if (!config) {
        throw new Error('useWalletConfig must be used within SevensWalletConfigProvider')
    }

    return config
}

export default ConfigContext