import React, { useEffect } from 'react'
import { SevensWalletConfigProvider } from './context/ConfigContext.js'
import SevensWalletProvider from './SevensWalletProvider.js'
import { setRuntimeConfig } from './utils/config.js'

/**
 * Configurable Sevens Wallet Provider
 * Combines configuration management with wallet provider functionality
 *
 * @param {Object} config - Custom configuration object to override defaults
 * @param {Object} config.CONNECTION_ENDPOINTS - Custom RPC endpoints
 * @param {Object} config.LANGUAGES - Additional language support
 * @param {string} config.SEVENS_TOKEN_IDL_PATH - Custom token metadata endpoint
 * @param {number} config.PASSWORD_MIN_LENGTH - Password requirements
 * @param {ReactNode} children - Child components
 */
export const SevensWalletConfigurableProvider = ({
    children,
    config = {},
    ...walletProviderProps
}) => {
    useEffect(() => {
        // Set runtime config for non-React contexts
        setRuntimeConfig(config)

        // Set global config for window access
        if (typeof window !== 'undefined') {
            window.__SEVENS_WALLET_CONFIG__ = config
        }
    }, [config])

    return (
        <SevensWalletConfigProvider config={config}>
            <SevensWalletProvider {...walletProviderProps}>
                {children}
            </SevensWalletProvider>
        </SevensWalletConfigProvider>
    )
}

export default SevensWalletConfigurableProvider