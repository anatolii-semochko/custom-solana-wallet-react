import React from 'react'
import { t } from '@wallet/translations/translations'
import { BlockTitle } from '@wallet/components/form-elements/Blocks'
import {
    ButtonBack, ButtonBalancesVisibility, ButtonChangeConnection, ButtonChangePassword, ButtonClearWallet,
} from '@wallet/components/form-elements/Buttons'
import CurrentLanguage from '@wallet/components/settings/components/CurrentLanguage'

const Settings = () => (
    <div>
        <BlockTitle title={t('walletSettings')} className={'mb-4'} />
        <div className={'d-grid gap-3'}>
            <CurrentLanguage />
            <ButtonChangeConnection />
            <ButtonBalancesVisibility />
            <ButtonChangePassword />
            <ButtonClearWallet />
            <ButtonBack label={t('backToWallet')} />
        </div>
    </div>
)

export default Settings
