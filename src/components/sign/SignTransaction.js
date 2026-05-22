import config from '@wallet/config.json'
import React, { useState, useEffect } from 'react'
import clsx from 'clsx'
import useWalletContext from '@wallet/hooks/useWalletContext'
import { t } from '@wallet/translations/translations'
import { connection, getWallet } from '@wallet/scripts/apiActions'
import { simulateAndSummarize } from '@wallet/scripts/simulate'
import { validateTransaction } from '@wallet/scripts/transactionValidator'
import { BlockTitle, AmountInfo } from '@wallet/components/form-elements/Blocks'
import { ButtonCancelSign, ButtonSign } from '@wallet/components/form-elements/Buttons'
import { ErrorMessageBlock } from '@wallet/components/form-elements/Messages'

const SignTransaction = ({ transaction, onSign, onCancel }) => {
    const {walletData, password, setShowComponent, handleReloadRequest} = useWalletContext()
    const [simulationData, setSimulationData] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (transaction) {
            simulateTransaction().catch(setError)
        }
    }, [transaction])

    const simulateTransaction = async () => {
        try {
            setError(null)

            // Client-side transaction validation before simulation
            const currentWalletKey = walletData?.currentWallet?.publicKey
            if (currentWalletKey) {
                const validation = validateTransaction(transaction, currentWalletKey)

                // If critical error found, show it immediately without simulation
                if (!validation.valid && validation.error) {
                    setError(validation.error)
                    setSimulationData({ ok: false, error: validation.error })
                    return
                }

                if (validation.warnings && validation.warnings.length > 0) {
                    console.warn('Transaction validation warnings:', validation.warnings)
                }
            }

            // RPC transaction simulation
            const result = await simulateAndSummarize(connection(), transaction, {
                idlUrl: config.SEVENS_TOKEN_IDL_PATH
            })
            setSimulationData(result)
            if (!result.ok) {
                setError(result.error)
            }
        } catch (error) {
            setError(error)
        }
    }

    const handleSignTransaction = async () => {
        try {
            setError(null)
            const wallet = getWallet(walletData, password)
            const signedTransaction = await wallet.signTransaction(transaction)
            onSign(signedTransaction)
            handleReloadRequest()
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

    if (!transaction) {
        return <NoTransaction />
    }

    return (
        <div>
            <BlockTitle title={t('signTransaction')} className={'mb-4'} />
            <SimulatingTransaction simulationData={simulationData} />
            {simulationData && (
                <div className={'d-grid gap-3'}>
                    {simulationData.ok && <TransactionSummary simulationData={simulationData} />}
                    <CoinsTransfer simulationData={simulationData} />
                    <TokenOperations simulationData={simulationData} />
                    {simulationData.ok && <AmountInfo
                        label={
                            simulationData.pay?.totalCost > 0
                                ? t('expectedTotalToIncome')
                                : t('expectedTotalToSpend')
                        }
                        amount={simulationData.pay?.totalCost}
                        isSpending={simulationData.pay?.totalCost <= 0}
                        hide={!!error}
                    />}
                    <ErrorMessageBlock message={error} className={'mb-0'} />
                    <div className="d-flex gap-2">
                        <ButtonCancelSign onClick={handleCancel} />
                        <ButtonSign
                            label={t('signTransaction')}
                            onClick={handleSignTransaction}
                            disabled={!simulationData.ok || error}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

const NoTransaction = () => (
    <div>
        <BlockTitle title={t('signTransaction')} className={'mb-4'} />
        <div className="alert alert-warning">{t('noTransactionProvided')}</div>
    </div>
)

const SimulatingTransaction = ({simulationData}) => !simulationData && (
    <div className="alert alert-info">
        <div className="d-flex align-items-center">
            <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">{t('loading')}</span>
            </div>
            {t('simulatingTransaction')}
        </div>
    </div>
)

const TransactionSummary = ({simulationData}) => (
    <div className="card">
        <div className="card-header text-center">{t('transactionSummary')}</div>
        <div className={clsx('card-body', simulationData.ok ? 'bg-success-subtle' : 'bg-danger-subtle')}>
            <div className="row mb-3">
                <div className="col-sm-4"><strong>{t('payer')}:</strong></div>
                <div className="col-sm-8 small text-primary">{simulationData.payer}</div>
            </div>
            <div className="row mb-2">
                <div className="col-sm-4"><strong>{t('expense')}:</strong></div>
                <div className="col-sm-8">
                    <div>
                        <span className="text-dark-red fw-bold">
                            - {formatLamports(simulationData.pay?.expense)}
                        </span>
                        <span className="fst-italic ps-1">{t('currencySEV')}</span>
                        {!simulationData.ok && !simulationData.pay?.expenseIsAccurate && (
                            <span className="text-warning small ms-1" title="Expense may be inaccurate for failed simulations">⚠️</span>
                        )}
                    </div>
                    <small className="text-muted">
                        ({simulationData.pay?.expense || 0} {t('lamports')})
                        {!simulationData.ok && !simulationData.pay?.expenseIsAccurate && (
                            <span className="text-warning d-block">Note: Expense calculation may be inaccurate for failed transactions</span>
                        )}
                    </small>
                </div>
            </div>
            <div className="row">
                <div className="col-sm-4"><strong>{t('fee')}:</strong></div>
                <div className="col-sm-8">
                    <div>
                        <span className="text-dark-red fw-bold">
                            - {formatLamports(simulationData.pay?.fee)}
                        </span>
                        <span className="fst-italic ps-1">{t('currencySEV')}</span>
                    </div>
                    <small className="text-muted">
                        ({simulationData.pay?.fee || 0} {t('lamports')})
                    </small>
                </div>
            </div>
            {!!simulationData.pay?.income && (
                <div className="row mt-2">
                    <div className="col-sm-4"><strong>{t('income')}:</strong></div>
                    <div className="col-sm-8">
                        <div>
                        <span className="text-success fw-bold">
                            + {formatLamports(simulationData.pay?.income)}
                        </span>
                            <span className="fst-italic ps-1">{t('currencySEV')}</span>
                        </div>
                        <small className="text-muted">
                            ({simulationData.pay?.income || 0} {t('lamports')})
                        </small>
                    </div>
                </div>
            )}
        </div>
    </div>
)

const CoinsTransfer = ({simulationData}) => simulationData.summaries?.solTransfers?.length > 0 && (
    <div className="card">
        <div className="card-header text-center">{t('sevTransfers')}</div>
        <div className="card-body">
            {simulationData.summaries.solTransfers.map((transfer, index) => (
                <div key={index} className="mb-2">
                    <div><strong>{t('from')}:</strong> <code className="small">{transfer.from}</code></div>
                    <div><strong>{t('to')}:</strong> <code className="small">{transfer.to}</code></div>
                    <div><strong>{t('amount')}:</strong> {formatLamports(transfer.lamports)} {t('currencySEV')}</div>
                    {index < simulationData.summaries.solTransfers.length - 1 && <hr/>}
                </div>
            ))}
        </div>
    </div>
)

const TokenOperations = ({simulationData}) => (
    simulationData.summaries?.mints?.length > 0 || simulationData.summaries?.splTransfers?.length > 0
) && (
    <div className="card">
        <div className="card-header text-center">{t('tokenOperations')}</div>
        <div className="card-body">
            {simulationData.summaries.mints?.map((mint, index) => (
                <div key={`mint-${index}`} className="mb-2">
                    <div className="badge bg-primary me-2">{t('mint').toUpperCase()}</div>
                    <div><strong>{t('mint')}:</strong> <code className="small">{mint.mint}</code></div>
                    <div><strong>{t('to')}:</strong> <code className="small">{mint.destination}</code></div>
                    <div><strong>{t('amount')}:</strong> {mint.amount}</div>
                </div>
            ))}
            {simulationData.summaries.splTransfers?.map((transfer, index) => (
                <div key={`transfer-${index}`} className="mb-2">
                    <div className="badge bg-info me-2">{t('transfer').toUpperCase()}</div>
                    <div><strong>{t('from')}:</strong> <code className="small">{transfer.source}</code></div>
                    <div><strong>{t('to')}:</strong> <code className="small">{transfer.destination}</code></div>
                    <div><strong>{t('amount')}:</strong> {transfer.amount}</div>
                </div>
            ))}
        </div>
    </div>
)

const formatLamports = (lamports) => {
    if (!lamports) return '0'
    return (lamports / 1e9).toFixed(9).replace(/\.?0+$/, '')
}

export default SignTransaction
