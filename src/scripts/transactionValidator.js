/**
 * Client-side transaction validator
 * Detects issues before RPC simulation
 */

import { PublicKey } from '@solana/web3.js'
import { t } from '@wallet/translations/translations'

/**
 * Extract all public keys from transaction instructions
 * @param {Transaction|VersionedTransaction} transaction - Transaction
 * @returns {Array<string>} Array of public keys
 */
function extractAccountKeys(transaction) {
    try {
        // For VersionedTransaction
        if (transaction.message) {
            const message = transaction.message
            if (message.staticAccountKeys) {
                return message.staticAccountKeys.map(key => key.toBase58())
            }
            // For legacy Transaction
            if (message.accountKeys) {
                return message.accountKeys.map(key => key.toBase58())
            }
        }

        // For legacy Transaction directly
        if (transaction.instructions) {
            const keys = new Set()
            transaction.instructions.forEach(ix => {
                if (ix.programId) keys.add(ix.programId.toBase58())
                if (ix.keys) {
                    ix.keys.forEach(meta => {
                        if (meta.pubkey) keys.add(meta.pubkey.toBase58())
                    })
                }
            })
            return Array.from(keys)
        }

        return []
    } catch (e) {
        console.warn('Failed to extract account keys:', e)
        return []
    }
}

/**
 * Extract signer public keys from transaction
 * @param {Transaction|VersionedTransaction} transaction - Transaction
 * @returns {Array<string>} Array of signer public keys
 */
function extractSignerKeys(transaction) {
    try {
        // For VersionedTransaction
        if (transaction.message) {
            const message = transaction.message
            const header = message.header || message.compiledHeader

            if (header && message.staticAccountKeys) {
                const numSigners = header.numRequiredSignatures
                return message.staticAccountKeys
                    .slice(0, numSigners)
                    .map(key => key.toBase58())
            }
        }

        // For legacy Transaction
        if (transaction.instructions) {
            const signers = new Set()
            transaction.instructions.forEach(ix => {
                if (ix.keys) {
                    ix.keys.forEach(meta => {
                        if (meta.isSigner && meta.pubkey) {
                            signers.add(meta.pubkey.toBase58())
                        }
                    })
                }
            })
            return Array.from(signers)
        }

        return []
    } catch (e) {
        console.warn('Failed to extract signer keys:', e)
        return []
    }
}

/**
 * Check if wallet is a transaction signer
 * @param {Transaction|VersionedTransaction} transaction - Transaction
 * @param {string} walletPublicKey - Wallet public key
 * @returns {boolean} true if wallet is signer
 */
export function isWalletSigner(transaction, walletPublicKey) {
    try {
        const signers = extractSignerKeys(transaction)
        return signers.includes(walletPublicKey)
    } catch (e) {
        console.warn('Failed to check if wallet is signer:', e)
        return false
    }
}

/**
 * Check if wallet is used in transaction
 * @param {Transaction|VersionedTransaction} transaction - Transaction
 * @param {string} walletPublicKey - Wallet public key
 * @returns {boolean} true if wallet is used
 */
export function isWalletInTransaction(transaction, walletPublicKey) {
    try {
        const keys = extractAccountKeys(transaction)
        return keys.includes(walletPublicKey)
    } catch (e) {
        console.warn('Failed to check if wallet in transaction:', e)
        return false
    }
}

/**
 * Validate transaction before simulation
 * @param {Transaction|VersionedTransaction} transaction - Transaction
 * @param {string} currentWalletPublicKey - Current wallet public key
 * @returns {Object} { valid: boolean, error: string|null, warnings: Array<string> }
 */
export function validateTransaction(transaction, currentWalletPublicKey) {
    const warnings = []

    try {
        // 1. Check basic structure
        if (!transaction) {
            return {
                valid: false,
                error: t('noTransactionProvided') || 'No transaction provided',
                warnings
            }
        }

        // 2. Check for instructions
        const hasInstructions = transaction.instructions?.length > 0 ||
                               transaction.message?.compiledInstructions?.length > 0 ||
                               transaction.message?.instructions?.length > 0

        if (!hasInstructions) {
            return {
                valid: false,
                error: t('transactionHasNoInstructions') || 'Transaction has no instructions',
                warnings
            }
        }

        // 3. Check fee payer
        let feePayer = null
        if (transaction.feePayer) {
            feePayer = transaction.feePayer.toBase58()
        } else if (transaction.message?.staticAccountKeys?.[0]) {
            feePayer = transaction.message.staticAccountKeys[0].toBase58()
        }

        if (!feePayer) {
            warnings.push(t('transactionMissingFeePayer') || 'Transaction missing fee payer')
        }

        // 4. Check if current wallet is signer
        const isSigner = isWalletSigner(transaction, currentWalletPublicKey)
        if (!isSigner) {
            // May be an authority issue
            const isInTx = isWalletInTransaction(transaction, currentWalletPublicKey)

            if (!isInTx) {
                warnings.push(
                    t('walletNotInTransaction') ||
                    'Current wallet is not used in this transaction'
                )
            } else {
                return {
                    valid: false,
                    error: t('walletNotAuthorized') ||
                           'Current wallet is not authorized to sign this transaction. Please select the correct wallet.',
                    warnings
                }
            }
        }

        // 5. Check if current wallet matches fee payer (if set)
        if (feePayer && feePayer !== currentWalletPublicKey && isSigner) {
            warnings.push(
                t('differentFeePayerWarning') ||
                'Transaction fee payer differs from current wallet'
            )
        }

        return {
            valid: true,
            error: null,
            warnings
        }

    } catch (e) {
        console.error('Transaction validation error:', e)
        return {
            valid: true, // Skip validation if error occurred
            error: null,
            warnings: [t('validationSkipped') || 'Validation skipped due to error']
        }
    }
}

/**
 * Get list of expected signers for user display
 * @param {Transaction|VersionedTransaction} transaction - Transaction
 * @returns {Array<string>} Array of expected signer public keys
 */
export function getExpectedSigners(transaction) {
    return extractSignerKeys(transaction)
}

/**
 * Format public key for display (shortened format)
 * @param {string} publicKey - Public key
 * @param {number} chars - Number of characters from each side
 * @returns {string} Shortened public key
 */
export function formatPublicKey(publicKey, chars = 4) {
    if (!publicKey || publicKey.length < chars * 2) return publicKey
    return `${publicKey.slice(0, chars)}...${publicKey.slice(-chars)}`
}
