import '@solana/wallet-adapter-react-ui/styles.css'
import React, { useMemo, useState, useEffect } from 'react'
import useWalletContext from '@wallet/hooks/useWalletContext'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { WalletContextProvider } from '@wallet/context/WalletContext'
import { SevensWalletAdapter } from '@wallet/SevensWalletAdapter'
import { SevensWalletSyncInitializer } from '@wallet/SevensWalletInitializer'
import { initializeSevensWallet } from '@wallet/SevensWalletProvider'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { hasEncryptedWallets } from '@wallet/scripts/storageActions'
import { ButtonWalletLock, ButtonHome, ButtonSettings } from '@wallet/components/form-elements/Buttons'
import { WalletHeader, WalletLoading } from '@wallet/components/form-elements/Blocks'
import Content from '@wallet/components/Content'
import WalletCreate from '@wallet/components/authorization/WalletCreate'
import WalletUnlock from '@wallet/components/authorization/WalletUnlock'

initializeSevensWallet()

const WalletInner = () => {
    const walletAdapters = useMemo(() => [
        new SevensWalletAdapter(),
        new PhantomWalletAdapter()
    ], [])
    const {walletConnection, walletsList, unlocked, setUnlocked, setPassword} = useWalletContext()
    const [hasWallets, setHasWallets] = useState(null) // null = loading, true/false = result

    const checkWallets = async () => {
        try {
            const exists = await hasEncryptedWallets()
            setHasWallets(exists)
        } catch (error) {
            setHasWallets(false)
        }
    }

    useEffect(() => {
        checkWallets().then()
    }, [])

    useEffect(() => {
        checkWallets().then()
    }, [walletsList])

    const unlock = () => setUnlocked(true)
    const lock = () => {
        setUnlocked(false)
        setPassword('')
    }

    const onWalletCreated = () => {
        setHasWallets(true)
        setUnlocked(true)
    }

    if (hasWallets === null) return <WalletLoading />
    if (!hasWallets) return <WalletCreate onWalletCreated={onWalletCreated} />
    if (!unlocked) return <WalletUnlock unlock={unlock} />

    return (
        <>
            <div className="panel-header p-3">
                <WalletHeader />
            </div>
            <div className="panel-scroll p-3">
                <div className="panel-content">
                    <ConnectionProvider endpoint={walletConnection}>
                        <WalletProvider wallets={walletAdapters} autoConnect>
                            <WalletModalProvider>
                                <SevensWalletSyncInitializer />
                                <Content />
                            </WalletModalProvider>
                        </WalletProvider>
                    </ConnectionProvider>
                </div>
            </div>
            <div className="panel-footer p-3 d-flex gap-2">
                <ButtonHome />
                <ButtonSettings />
                <ButtonWalletLock onClick={lock} />
            </div>
        </>
    )
}

const Wallet = () => (
    <WalletContextProvider>
        <WalletInner />
    </WalletContextProvider>
)

export { Wallet, initializeSevensWallet }
