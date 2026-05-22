import React, {useState} from 'react'
import useWalletContext from '@wallet/hooks/useWalletContext'
import { t } from '@wallet/translations/translations'
import { ButtonBack, ButtonTokenTransfer} from '@wallet/components/form-elements/Buttons'
import { ErrorMessageBlock, InfoMessageBlock } from '@wallet/components/form-elements/Messages'
import { transferToken, getWallet } from '@wallet/scripts/apiActions'
import { isValidWalletAddress } from '@wallet/scripts/utils'

const TokenTransfer = ({ token, setBlockTransfer, setTokenAvailable, setSuccessMessage }) => {
    const {walletData, walletReload, password} = useWalletContext()
    const [errorMessage, setErrorMessage] = useState(null)
    const [confirmMessage, setConfirmMessage] = useState(null)
    const [transferDestinationAddress, setTransferDestinationAddress] = useState('')

    const handlerTransferToken = async () => {
        setErrorMessage(null)
        if (!transferDestinationAddress) {
            return setErrorMessage(t('noDestinationAddress'))
        }
        if (!isValidWalletAddress(transferDestinationAddress)) {
            return setErrorMessage(t('invalidDestinationAddress'))
        }
        if (!confirmMessage) {
            return setConfirmMessage(
                t('tokenTransferWarning').replace('{address}', transferDestinationAddress)
            )
        }
        setConfirmMessage(false)
        try {
            const wallet = getWallet(walletData, password)
            const transaction = await transferToken(token.mint, transferDestinationAddress, wallet)
            setTokenAvailable(false)
            setBlockTransfer(false)
            await walletReload()
            setSuccessMessage(
                t('tokenTransferSuccess')
                    .replace('{address}', transferDestinationAddress)
                    .replace('{tx}', transaction)
            )
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    return (
        <>
            <label className="text-center">{t('transferTokenToAnotherWallet')}</label>
            <input
                className="form-control"
                placeholder={t('newWalletAddress')}
                value={transferDestinationAddress}
                onChange={(e) => {
                    setTransferDestinationAddress(e.target.value)
                    setErrorMessage(null)
                }}
            />
            <ErrorMessageBlock message={errorMessage} className={'mb-0'}/>
            <InfoMessageBlock message={confirmMessage} className={'mb-0'}/>
            <ButtonTokenTransfer onClick={handlerTransferToken} />
            <ButtonBack label={t('cancelTokenTransfer')} onClick={() => setBlockTransfer(false)} />
        </>
    )
}

export default TokenTransfer
