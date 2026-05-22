import React from 'react'
import useWalletContext from '@wallet/hooks/useWalletContext'
import WalletsList from '@wallet/components/wallets-list/WalletsList'
import AddWallet from '@wallet/components/wallet-add/AddWallet'
import AddressCopy from '@wallet/components/wallet-block/components/AddressCopy'
import SendCoins from '@wallet/components/wallet-block/components/SendCoins'
import Token from '@wallet/components/tokens-list/Token'
import Settings from '@wallet/components/settings/Settings'
import SettingsConnection from '@wallet/components/settings/components/SettingsConnection'
import ChangePassword from '@wallet/components/settings/components/ChangePassword'
import WalletClear from '@wallet/components/settings/components/WalletClear'
import SignTransaction from '@wallet/components/sign/SignTransaction'
import SignMessage from '@wallet/components/sign/SignMessage'

const componentsMap = {
    WalletsList,
    AddWallet,
    AddressCopy,
    SendCoins,
    Token,
    Settings,
    SettingsConnection,
    ChangePassword,
    WalletClear,
    SignTransaction,
    SignMessage,
}

const ShowComponent = () => {
    const { showComponent } = useWalletContext()
    const ComponentToRender = componentsMap[showComponent.component] || null
    const props = showComponent.props || {}

    return (
        <div className="d-grid gap-3 mb-3">
            {ComponentToRender ? <ComponentToRender {...props} /> : null}
        </div>
    )
}

export default ShowComponent
