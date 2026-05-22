import React, { useState } from 'react'
import useWalletContext from '@wallet/hooks/useWalletContext'
import { t } from '@wallet/translations/translations'
import { renameWallet } from '@wallet/scripts/apiActions'
import { checkWalletName } from '@wallet/scripts/utils'
import { BlockTitle, WalletDetails } from '@wallet/components/form-elements/Blocks'
import { ButtonBack, ButtonWalletRename } from '@wallet/components/form-elements/Buttons'
import { InputNewWalletName } from '@wallet/components/form-elements/Inputs'
import { ErrorMessageBlock } from '@wallet/components/form-elements/Messages'

const WalletRename = ({walletData, setShowWalletRename, setShowWalletActions}) => {
    const {walletsList, walletReload, password} = useWalletContext()
    const [walletName, setWalletName] = useState(walletData.name)
    const [errorMessage, setErrorMessage] = useState(null)

    const handleRenameWallet = async () => {
        setErrorMessage(null)
        try {
            if (walletName === walletData.name) {
                return setShowWalletRename(false)
            }
            checkWalletName(walletsList, walletName)
            renameWallet(walletData.publicKey, walletName, password)
                .then(async () => walletReload())
                .catch(error => setErrorMessage(error.message))
            setShowWalletActions(false)
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    return (
        <div>
            <BlockTitle title={t('renameWalletTitle').replace('{name}', walletData.name)} className={'mb-4'} />
            <div className="d-grid gap-3">
                <WalletDetails walletData={walletData} className={'mb-0'} />
                <InputNewWalletName
                    walletName={walletName}
                    setWalletName={setWalletName}
                    setErrorMessage={setErrorMessage}
                />
                <ErrorMessageBlock message={errorMessage} className={'mb-0'} />
                <ButtonWalletRename onClick={() => handleRenameWallet()} />
                <ButtonBack onClick={() => setShowWalletRename(false)} />
            </div>
        </div>
    )
}

export default WalletRename
