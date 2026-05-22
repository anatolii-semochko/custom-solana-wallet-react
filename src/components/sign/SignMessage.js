import React, { useState } from 'react'
import useWalletContext from '@wallet/hooks/useWalletContext'
import { t } from '@wallet/translations/translations'
import { getWallet } from '@wallet/scripts/apiActions'
import { BlockTitle } from '@wallet/components/form-elements/Blocks'
import { ButtonCancelSign, ButtonSign } from '@wallet/components/form-elements/Buttons'
import { ErrorMessageBlock } from '@wallet/components/form-elements/Messages'

const SignMessage = ({ message, onSign, onCancel }) => {
    const { walletData, password, setShowComponent } = useWalletContext()
    const [error, setError] = useState(null)

    const handleSignMessage = async () => {
        try {
            setError(null)
            const wallet = getWallet(walletData, password)
            const signature = await wallet.signMessage(message)
            onSign(signature)
        } catch (error) {
            setError(error)
        } finally {
            setShowComponent(null)
        }
    }

    const handleCancel = () => {
        onCancel()
        setShowComponent(null)
    }

    if (!message) {
        return <NoMessage />
    }

    return (
        <div>
            <BlockTitle title={t('signMessage')} className={'mb-4'}/>
            <div className={'d-grid gap-3'}>
                <WalletInformation walletData={walletData} />
                <MessageContent message={message} />
                <ErrorMessageBlock message={error} className={'mb-0'} />
                <div className="d-flex gap-2">
                    <ButtonCancelSign onClick={handleCancel} />
                    <ButtonSign label={t('signMessage')} onClick={handleSignMessage} disabled={error} />
                </div>
            </div>
        </div>
    )
}

const NoMessage = () => (
    <div>
        <BlockTitle title={t('signMessage')} className={'mb-4'}/>
        <div className="alert alert-warning">{t('noMessageProvided')}</div>
    </div>
)

const MessageContent = ({message}) => {
    let messageText = message
    if (message instanceof Uint8Array) {
        messageText = new TextDecoder().decode(message)
    }

    return (
        <div className="card">
            <div className="card-header">
                <div className="text-center">{t('messageToSign')}</div>
            </div>
            <div className="card-body card-body alert alert-info mb-0">
                <div className="mb-3">
                    <strong>{t('youAreAboutToSign')}</strong>
                </div>
                {messageText.split("\n").map((phrase, key) => (
                    <div key={key} className="mb-3 text-wrap small">{phrase}</div>
                ))}
                <div className="text-muted">
                    <strong className="me-2">{t('signNote')}</strong>
                    {t('signNoteText')}
                </div>
            </div>
        </div>
    )
}

const WalletInformation = ({walletData}) => (
    <div className="card">
        <div className="card-header">
            <h6 className="mb-0">{t('walletInformation')}</h6>
        </div>
        <div className="card-body">
            <div className="row mb-2">
                <div className="col-sm-4"><strong>{t('wallet')}:</strong></div>
                <div className="col-sm-8">{walletData?.name || t('unknown')}</div>
            </div>
            <div className="row">
                <div className="col-sm-4"><strong>{t('address')}:</strong></div>
                <div className="col-sm-8 small text-primary">{walletData?.publicKey || t('notAvailable')}</div>
            </div>
        </div>
    </div>
)

export default SignMessage
