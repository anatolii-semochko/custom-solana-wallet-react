import React, { useEffect, useState } from 'react'
import useWalletContext from '@wallet/hooks/useWalletContext'
import { t } from '@wallet/translations/translations'
import { getWallet, burnSevensToken } from '@wallet/scripts/apiActions'
import { InputPassword } from '@wallet/components/form-elements/Inputs'
import { ButtonBack, ButtonTokenBurn } from '@wallet/components/form-elements/Buttons'
import { ErrorMessageBlock } from '@wallet/components/form-elements/Messages'

const TokenBurn = ({ token, setBlockBurn, setTokenAvailable, setSuccessMessage }) => {
    const {walletData, walletReload, password} = useWalletContext()
    const [errorMessage, setErrorMessage] = useState(null)
    const [confirmMessage, setConfirmMessage] = useState(null)
    const [confirmPassword, setConfirmPassword] = useState('')
    const [confirm, setConfirm] = useState(null)

    const firstConfirmMessage = t('burnTokenWarning1')
    const secondConfirmMessage = t('burnTokenWarning2')

    useEffect(() => {
        setConfirmMessage(firstConfirmMessage)
    }, [])

    const handlerBurnToken = async () => {
        setErrorMessage(null)
        if (!confirm) {
            setConfirm(true)
            setConfirmMessage(secondConfirmMessage)
            return
        }
        if (confirmPassword !== password) {
            setErrorMessage(t('invalidPassword'))
            return
        }
        setConfirmMessage(false)
        setConfirm(false)
        try {
            const wallet = getWallet(walletData, password)
            // TODO - add check what token is to burn and call "burnSevensToken" or "burnSPLToken"
            // TODO - don't show tokens in wallet which have been burned as standard SPL burn
            const transaction = await burnSevensToken(token.mint, wallet)
            setTokenAvailable(false)
            setBlockBurn(false)
            await walletReload()
            setSuccessMessage(t('tokenBurnSuccess').replace('{tx}', transaction))
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    return (
        <>
            <ErrorMessageBlock message={confirmMessage} className={'mb-0'} />
            {!!confirm && (
                <InputPassword {...{password: confirmPassword, setPassword: setConfirmPassword, setErrorMessage}} />
            )}
            <ErrorMessageBlock message={errorMessage} className={'mb-0'} />
            <ButtonTokenBurn label={!confirm && t('confirmBurnYes')} onClick={handlerBurnToken} />
            <ButtonBack label={t('cancelTokenBurn')} onClick={() => setBlockBurn(false)} />
        </>
    )
}

export default TokenBurn
