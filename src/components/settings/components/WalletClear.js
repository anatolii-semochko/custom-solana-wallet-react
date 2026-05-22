import React, { useState } from 'react'
import useWalletContext from '@wallet/hooks/useWalletContext'
import { t } from '@wallet/translations/translations'
import { clearWallet } from '@wallet/scripts/storageActions'
import { BlockTitle } from '@wallet/components/form-elements/Blocks'
import { ButtonBack, ButtonClearWallet } from '@wallet/components/form-elements/Buttons'
import { InfoMessageBlock } from '@wallet/components/form-elements/Messages'

const WalletClear = ({setShowWalletClear}) => {
    const {setWalletsList, setShowComponent} = useWalletContext()
    const [confirm, setConfirm] = useState(false)

    const handleWalletClear = async () => {
        if (!confirm) {
            return setConfirm(true)
        }
        clearWallet()
        setWalletsList([])
        setShowComponent(null)
        setShowWalletClear(false)
    }

    return (
        <div>
            <BlockTitle title={t('clearWalletData')} className={'mb-4'}/>
            <div className="d-grid gap-3">
                <InfoMessageBlock
                    message={t('clearWalletWarning')}
                    className={'text-danger mb-0'}
                />
                {confirm && <InfoMessageBlock
                    message={t('confirmClearWallet')}
                    className={'text-danger mb-0'}
                />}
                <ButtonClearWallet onClick={() => handleWalletClear()} />
                <ButtonBack onClick={() => setShowComponent({component: 'Settings'})} />
            </div>
        </div>
    )
}

export default WalletClear
