import React, { useEffect, useState } from 'react'
import { t } from '@wallet/translations/translations'
import { getKeyFromSeed } from '@wallet/scripts/crypto'
import { capitalizeFirstLetter } from '@wallet/scripts/utils'
import { ButtonContinue } from '@wallet/components/form-elements/Buttons'
import { ErrorMessageBlock } from '@wallet/components/form-elements/Messages'

const RestoreBySeed = ({setKp}) => {
    const [seed, setSeed] = useState('')
    const [errorMessage, setErrorMessage] = useState(null)
    useEffect(() => {
        setKp(null)
    }, [])

    const checkWallet = async () => {
        setErrorMessage(null)
        try {
            const kp = getKeyFromSeed(seed)
            setKp(kp)
        } catch (error) {
            setErrorMessage(capitalizeFirstLetter(error.message))
        }
    }

    return (
        <>
            <textarea
                className="form-control mb-1"
                placeholder={t('seed32')}
                rows={2}
                value={seed}
                onChange={(e) => {
                    setSeed(e.target.value.trim())
                    setErrorMessage(null)
                }}
            />
            <ErrorMessageBlock message={errorMessage} className={'mb-1'} />
            {seed && <ButtonContinue onClick={() => checkWallet()} />}
        </>
    )
}

export default RestoreBySeed
