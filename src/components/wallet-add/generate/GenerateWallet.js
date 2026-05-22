import React, {useState} from 'react'
import { t } from '@wallet/translations/translations'
import { getGeneratedMnemonic, getKeyFromMnemonic, BIP_DEFAULT } from '@wallet/scripts/crypto'
import { BlockTitle } from '@wallet/components/form-elements/Blocks'
import { ButtonBack, ButtonGenerateNewWallet } from '@wallet/components/form-elements/Buttons'
import { MessagesBlock, SuccessMessageBlock } from '@wallet/components/form-elements/Messages'
import { SelectPhraseLength } from '@wallet/components/form-elements/Inputs'
import SaveSeedPhrase from '@wallet/components/wallet-add/generate/SaveSeedPhrase'
import ConfirmWallet from '@wallet/components/wallet-add/generate/ConfirmWallet'

const GenerateWallet = ({ setKp, setMnemonic, setShowBlockGenerateWallet }) => {
    const [errorMessage, setErrorMessage] = useState(null)
    const [informGenerateMessage, setInformGenerateMessage] = useState(null)
    const [seedLength, setSeedLength] = useState(BIP_DEFAULT)
    const [mnemonic, setInputMnemonic] = useState(null)
    const [mnemonicSaved, setMnemonicSaved] = useState(null)

    const handlerGenerateWallet = () => {
        try {
            setErrorMessage(null)
            if (!informGenerateMessage) {
                return setInformGenerateMessage(t('privateInfoWarning'))
            }
            setInformGenerateMessage(false)
            setInputMnemonic(getGeneratedMnemonic(seedLength))
        } catch (error) {
            setErrorMessage(error)
        }
    }

    const handleMnemonicConfirmed = async () => {
        try {
            const kp = await getKeyFromMnemonic(mnemonic)
            setKp(kp)
            setMnemonic(mnemonic)
            setShowBlockGenerateWallet(false)
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    if (mnemonicSaved) return <ConfirmWallet
        mnemonic={mnemonic.split(' ')}
        setMnemonicSaved={setMnemonicSaved}
        handleMnemonicConfirmed={handleMnemonicConfirmed}
    />

    if (mnemonic) return <SaveSeedPhrase
        mnemonic={mnemonic}
        setShowBlockGenerateWallet={setShowBlockGenerateWallet}
        setMnemonicSaved={setMnemonicSaved}
    />

    return (
        <div>
            <BlockTitle title={t('generateNewWallet')} className={'mb-4'}/>
            <div className="d-grid gap-3">
                <SelectPhraseLength value={seedLength} onChange={(value) => setSeedLength(value)} />
                <SuccessMessageBlock message={informGenerateMessage} className={'text-danger mb-0'} />
                <MessagesBlock error={errorMessage} className={'mb-0'}/>
                <ButtonGenerateNewWallet
                    label={informGenerateMessage ? t('continue') : t('generate')}
                    onClick={() => handlerGenerateWallet()}
                />
                <ButtonBack label={t('cancel')} onClick={() => setShowBlockGenerateWallet(false)} />
            </div>
        </div>
    )
}

export default GenerateWallet
