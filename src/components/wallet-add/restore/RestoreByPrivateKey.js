import React, { useEffect, useState } from 'react'
import { t } from '@wallet/translations/translations'
import { getKeyFromPrivateKey } from '@wallet/scripts/crypto'
import { capitalizeFirstLetter } from '@wallet/scripts/utils'
import { ButtonContinue } from '@wallet/components/form-elements/Buttons'
import { ErrorMessageBlock } from '@wallet/components/form-elements/Messages'

const RestoreByPrivateKey = ({setKp}) => {
    const [privateKey, setPrivateKey] = useState('')
    const [errorMessage, setErrorMessage] = useState(null)
    useEffect(() => {
        setKp(null)
    }, [])

    const checkWallet = async () => {
        setErrorMessage(null)
        try {
            const kp = getKeyFromPrivateKey(privateKey)
            setKp(kp)
        } catch (error) {
            setErrorMessage(capitalizeFirstLetter(error.message))
        }
    }

    return (
        <>
            <textarea
                className="form-control mb-1"
                placeholder={t('privateKey64')}
                rows={3}
                value={privateKey}
                onChange={(e) => {
                    setPrivateKey(e.target.value.trim())
                    setErrorMessage(null)
                }}
            />
            <ErrorMessageBlock message={errorMessage} className={'mb-1'} />
            {privateKey && <ButtonContinue onClick={() => checkWallet()} />}
        </>
    )
}

export default RestoreByPrivateKey
