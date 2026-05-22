import React, { useState } from 'react'
import config from '@wallet/config.json'
import useWalletContext from '@wallet/hooks/useWalletContext'
import { t } from '@wallet/translations/translations'
import { createEncryptedWallets } from '@wallet/scripts/storageActions'
import { ButtonSave } from '@wallet/components/form-elements/Buttons'
import { InputPassword } from '@wallet/components/form-elements/Inputs'
import { ErrorMessageBlock } from '@wallet/components/form-elements/Messages'
import { WalletHeader } from '@wallet/components/form-elements/Blocks'

const WalletCreate = ({ onWalletCreated }) => {
    const {setPassword} = useWalletContext()
    const [passwordMain, setPasswordMain] = useState('')
    const [passwordRepeat, setPasswordRepeat] = useState('')
    const [errorMessage, setErrorMessage] = useState(null)

    const checkPassword = () => {
        if (!passwordMain || passwordMain.length < config.PASSWORD_MIN_LENGTH) {
            throw new Error(t('passwordTooShort').replace('{n}', config.PASSWORD_MIN_LENGTH))
        }
        if (passwordMain !== passwordRepeat) {
            throw new Error(t('passwordsDontMatch'))
        }
    }

    const handleCreatePassword = async (e) => {
        try {
            e?.preventDefault()
            setErrorMessage(null)
            checkPassword()
            await createEncryptedWallets(passwordMain)
            setPassword(passwordMain)
            if (onWalletCreated) {
                onWalletCreated()
            }
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    return (
        <div>
            <WalletHeader />
            <form onSubmit={handleCreatePassword} className="p-3 d-grid gap-3">
                <label className="text-center">{t('enterWalletPassword')}</label>
                <InputPassword
                    placeholder={t('enterPassword')}
                    password={passwordMain}
                    setPassword={setPasswordMain}
                    setErrorMessage={setErrorMessage}
                />
                <InputPassword
                    placeholder={t('repeatPassword')}
                    password={passwordRepeat}
                    setPassword={setPasswordRepeat}
                    setErrorMessage={setErrorMessage}
                />
                <ErrorMessageBlock message={errorMessage} className={'mb-0'} />
                <ButtonSave label={t('createWallet')} onClick={handleCreatePassword} />
            </form>
        </div>
    )
}

export default WalletCreate
