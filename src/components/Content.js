import React from 'react'
import '@solana/wallet-adapter-react-ui/styles.css'
import useWalletContext from '@wallet/hooks/useWalletContext'
import { t } from '@wallet/translations/translations'
import { BlockTitle, ConnectionInfo } from '@wallet/components/form-elements/Blocks'
import { ButtonWalletAdd, ButtonWalletSelect } from '@wallet/components/form-elements/Buttons'
import Main from '@wallet/components/wallet-block/Main'
import TokensList from '@wallet/components/tokens-list/TokensList'
import ShowComponent from '@wallet/components/components-map/ShowComponent'

const Content = () => {
    const {walletData, walletsList, showComponent, setShowComponent} = useWalletContext()

    if (walletsList === null) return (
        <div className="d-flex justify-content-center mt-3">
            <div className="spinner-border" role="status">
                <span className="visually-hidden">{t('loading')}</span>
            </div>
        </div>
    )

    if (showComponent) return (
        <div>
            <ConnectionInfo />
            <ShowComponent />
        </div>
    )

    if (walletsList.length === 0) return (
        <div>
            <BlockTitle title={t('noWallets')} className={'mb-0'} />
            <ButtonWalletAdd onClick={() => setShowComponent({component: 'AddWallet'})} className={'mt-1'} />
        </div>
    )

    return (
        <div>
            <ConnectionInfo />
            <ButtonWalletSelect />
            <Main walletData={walletData}/>
            <TokensList tokens={walletData?.tokens} />
        </div>
    )
}

export default Content
