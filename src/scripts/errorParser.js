import { t } from '@wallet/translations/translations'

/**
 * Universal Solana transaction simulation error parser
 * Supports various error formats: InstructionError, Custom, Anchor IDL, etc.
 */

// IDL cache
let idlCache = null
let idlLoadPromise = null

/**
 * Load Anchor IDL from configuration
 * @param {string} idlUrl - IDL file URL
 * @returns {Promise<Object|null>} IDL object or null
 */
async function loadIdl(idlUrl) {
    if (idlCache) return idlCache
    if (idlLoadPromise) return idlLoadPromise

    idlLoadPromise = fetch(idlUrl)
        .then(res => res.ok ? res.json() : null)
        .catch(() => null)
        .finally(() => {
            idlLoadPromise = null
        })

    idlCache = await idlLoadPromise
    return idlCache
}

/**
 * Extract custom error code from various error formats
 * @param {any} error - Error object
 * @returns {number|null} Error code or null
 */
function extractCustomErrorCode(error) {
    // Format: {"InstructionError":[0,{"Custom":6000}]}
    if (error?.InstructionError?.[1]?.Custom !== undefined) {
        return error.InstructionError[1].Custom
    }

    // Format: {"Custom":6000}
    if (error?.Custom !== undefined) {
        return error.Custom
    }

    // Format from logs: "Program returned error: Custom(6000)"
    if (typeof error === 'string') {
        const match = error.match(/Custom\((\d+)\)/i)
        if (match) return parseInt(match[1])
    }

    return null
}

/**
 * Extract instruction index from error
 * @param {any} error - Error object
 * @returns {number|null} Instruction index or null
 */
function extractInstructionIndex(error) {
    // Format: {"InstructionError":[0,{...}]}
    if (error?.InstructionError?.[0] !== undefined) {
        return error.InstructionError[0]
    }
    return null
}

/**
 * Format message with instruction number (only if > 0)
 * @param {string} message - Error message
 * @param {number|null} ixIndex - Instruction index
 * @returns {string} Formatted message
 */
function formatWithInstructionIndex(message, ixIndex) {
    // Show instruction number only if there are multiple instructions (index > 0)
    if (ixIndex !== null && ixIndex > 0) {
        return `Instruction #${ixIndex}: ${message}`
    }
    return message
}

/**
 * Parse Anchor custom error using IDL
 * @param {number} errorCode - Error code
 * @param {Object|null} idl - Anchor IDL
 * @returns {string|null} Error message or null
 */
function parseAnchorError(errorCode, idl) {
    if (!idl?.errors || !Array.isArray(idl.errors)) {
        return null
    }

    const errorDef = idl.errors.find(e => e.code === errorCode)
    if (errorDef) {
        return errorDef.msg || errorDef.name || `Anchor Error ${errorCode}`
    }

    return null
}

/**
 * Parse standard Solana errors (non-Custom)
 * @param {any} error - Error object
 * @returns {string|null} Error message or null
 */
function parseStandardSolanaError(error) {
    // InsufficientFundsForFee
    if (error?.InsufficientFundsForFee !== undefined) {
        return t('insufficientFundsForFee') || 'Insufficient funds for transaction fee'
    }

    // InsufficientFundsForRent
    if (error?.InsufficientFundsForRent !== undefined) {
        return t('insufficientFundsForRent') || 'Insufficient funds for rent'
    }

    // AccountNotFound
    if (error?.AccountNotFound !== undefined) {
        return t('accountNotFound') || 'Account not found'
    }

    // InvalidAccountData
    if (error?.InvalidAccountData !== undefined) {
        return t('invalidAccountData') || 'Invalid account data'
    }

    // ProgramFailedToComplete
    if (error?.ProgramFailedToComplete !== undefined) {
        return t('programFailedToComplete') || 'Program failed to complete'
    }

    // AlreadyProcessed
    if (error?.AlreadyProcessed !== undefined) {
        return t('alreadyProcessed') || 'Transaction already processed'
    }

    // Check InstructionError for non-Custom variants
    if (error?.InstructionError?.[1]) {
        const innerError = error.InstructionError[1]

        // Common instruction errors
        if (innerError.InsufficientFunds !== undefined) {
            return t('insufficientFunds') || 'Insufficient funds'
        }
        if (innerError.InvalidArgument !== undefined) {
            return t('invalidArgument') || 'Invalid argument'
        }
        if (innerError.InvalidInstructionData !== undefined) {
            return t('invalidInstructionData') || 'Invalid instruction data'
        }
        if (innerError.InvalidAccountData !== undefined) {
            return t('invalidAccountData') || 'Invalid account data'
        }
        if (innerError.AccountDataTooSmall !== undefined) {
            return t('accountDataTooSmall') || 'Account data too small'
        }
        if (innerError.InsufficientFunds !== undefined) {
            return t('insufficientFunds') || 'Insufficient funds'
        }
        if (innerError.IncorrectProgramId !== undefined) {
            return t('incorrectProgramId') || 'Incorrect program ID'
        }
        if (innerError.MissingRequiredSignature !== undefined) {
            return t('missingRequiredSignature') || 'Missing required signature'
        }
        if (innerError.AccountAlreadyInitialized !== undefined) {
            return t('accountAlreadyInitialized') || 'Account already initialized'
        }
        if (innerError.UninitializedAccount !== undefined) {
            return t('uninitializedAccount') || 'Uninitialized account'
        }
    }

    return null
}

/**
 * Extract useful information from simulation logs
 * @param {Array<string>} logs - Simulation logs
 * @returns {Object} Object with extracted information
 */
function extractInfoFromLogs(logs) {
    if (!Array.isArray(logs) || logs.length === 0) {
        return { programErrors: [], customErrors: [], hints: [], anchorConstraints: [], anchorErrorMessages: [] }
    }

    const programErrors = []
    const customErrors = []
    const hints = []
    const anchorConstraints = []
    const anchorErrorMessages = []

    for (const log of logs) {
        // PRIORITY 1: "Error Message: Unauthorized: only the authority can update tariffs.."
        // Most accurate message directly from program
        if (log.includes('Error Message:')) {
            const parts = log.split('Error Message:')
            if (parts.length > 1) {
                let message = parts[1].trim()
                // Remove trailing dots if present
                message = message.replace(/\.+$/, '')
                if (message) {
                    anchorErrorMessages.push(message)
                }
            }
        }

        // "Program <program_id> failed: custom program error: 0x1770"
        const programErrorMatch = log.match(/Program (\w+) failed: (.+)/i)
        if (programErrorMatch) {
            programErrors.push({
                program: programErrorMatch[1],
                message: programErrorMatch[2]
            })
        }

        // "Error: custom program error: 0x1770" (hex format)
        const hexErrorMatch = log.match(/custom program error: 0x([0-9a-fA-F]+)/i)
        if (hexErrorMatch) {
            const errorCode = parseInt(hexErrorMatch[1], 16)
            customErrors.push(errorCode)
        }

        // "Error Code: ConstraintMut" (Anchor constraint errors)
        const anchorConstraintMatch = log.match(/Error Code: (\w+)/i)
        if (anchorConstraintMatch) {
            anchorConstraints.push(anchorConstraintMatch[1])
        }

        // "AnchorError thrown in programs/..." - detailed information
        if (log.includes('AnchorError')) {
            hints.push(log)
        }

        // Constraint violations
        if (log.includes('constraint') || log.includes('Constraint')) {
            hints.push(log)
        }

        // Authority or ownership constraint errors
        if (log.includes('has_one') || log.includes('ConstraintHasOne')) {
            hints.push('Authority or ownership constraint failed')
        }

        // PDA constraint errors
        if (log.includes('seeds') || log.includes('ConstraintSeeds')) {
            hints.push('Account derivation (PDA) constraint failed')
        }

        // Signer constraints
        if (log.includes('signer') && log.includes('constraint')) {
            hints.push('Signer constraint failed - account must sign transaction')
        }

        // "Transfer: insufficient lamports 8458800, need 5000000000"
        const insufficientLamportsMatch = log.match(/insufficient lamports (\d+), need (\d+)/i)
        if (insufficientLamportsMatch) {
            const currentBalance = parseInt(insufficientLamportsMatch[1])
            const transferAmount = parseInt(insufficientLamportsMatch[2])

            const balanceSOL = (currentBalance / 1e9).toFixed(9).replace(/\.?0+$/, '')

            // If simulation context available - use expense + fee
            if (logs.__simulationContext?.fee !== undefined) {
                const expense = logs.__simulationContext.expense || 0
                const fee = logs.__simulationContext.fee
                const expenseIsAccurate = logs.__simulationContext.expenseIsAccurate

                // If expense INACCURATE (failed simulation) - use data from logs
                if (!expenseIsAccurate) {
                    const minTransferNeeded = transferAmount
                    const transferSOL = (minTransferNeeded / 1e9).toFixed(9).replace(/\.?0+$/, '')
                    const feeSOL = (fee / 1e9).toFixed(9).replace(/\.?0+$/, '')
                    const minTotalSOL = ((minTransferNeeded + fee) / 1e9).toFixed(9).replace(/\.?0+$/, '')
                    const shortfallSOL = ((minTransferNeeded + fee - currentBalance) / 1e9).toFixed(9).replace(/\.?0+$/, '')

                    const message = `Insufficient balance: you have ${balanceSOL} SEV, need at least ${minTotalSOL} SEV (${transferSOL} SEV transfer + ${feeSOL} SEV fee + possible rent). Short by at least ${shortfallSOL} SEV`
                    hints.unshift(message)
                } else {
                    // Expense ACCURATE (successful simulation or precise calculation)
                    const totalNeeded = expense + fee
                    const expenseSOL = (expense / 1e9).toFixed(9).replace(/\.?0+$/, '')
                    const feeSOL = (fee / 1e9).toFixed(9).replace(/\.?0+$/, '')
                    const totalNeededSOL = (totalNeeded / 1e9).toFixed(9).replace(/\.?0+$/, '')
                    const shortfall = totalNeeded - currentBalance
                    const shortfallSOL = (shortfall / 1e9).toFixed(9).replace(/\.?0+$/, '')

                    const message = `Insufficient balance: you have ${balanceSOL} SEV, need ${totalNeededSOL} SEV (${expenseSOL} SEV expense + ${feeSOL} SEV fee). Short by ${shortfallSOL} SEV`
                    hints.unshift(message)
                }
            } else {
                // Fallback: use data from logs (less accurate)
                const transferSOL = (transferAmount / 1e9).toFixed(9).replace(/\.?0+$/, '')
                const message = `Insufficient balance: you have ${balanceSOL} SEV, but trying to transfer ${transferSOL} SEV`
                hints.unshift(message)
            }
        } else if (log.toLowerCase().includes('insufficient')) {
            // General case
            hints.push(log)
        }

        // Account errors
        if (log.toLowerCase().includes('account')) {
            if (log.toLowerCase().includes('not found') ||
                log.toLowerCase().includes('does not exist')) {
                hints.push('Account not found or not initialized')
            }
        }
    }

    return { programErrors, customErrors, hints, anchorConstraints, anchorErrorMessages }
}

/**
 * Main simulation error parsing function
 * @param {any} error - Error object from simulateTransaction
 * @param {Array<string>} logs - Simulation logs (optional)
 * @param {string} idlUrl - IDL file URL (optional)
 * @param {Object} simulationContext - Additional simulation context (fee, balances, etc.)
 * @returns {Promise<string>} Human-readable error message
 */
export async function parseSimulationError(error, logs = [], idlUrl = null, simulationContext = null) {
    // No error found
    if (!error) {
        return null
    }

    // Already a string
    if (typeof error === 'string') {
        try {
            error = JSON.parse(error)
        } catch {
            // Already text error, return as is
            return error
        }
    }

    // 1. Check standard Solana errors
    const standardError = parseStandardSolanaError(error)
    if (standardError) {
        const ixIndex = extractInstructionIndex(error)
        return formatWithInstructionIndex(standardError, ixIndex)
    }

    // 2. PRIORITY: Extract information from logs (MOST ACCURATE!)
    // Add simulation context to logs for use in extractInfoFromLogs
    if (simulationContext && Array.isArray(logs)) {
        logs.__simulationContext = simulationContext
    }
    const logInfo = extractInfoFromLogs(logs)

    // 2A. PRIORITY 0: Anchor Error Message from logs (most accurate)
    // Format: "Error Message: Unauthorized: only the authority can update tariffs."
    if (logInfo.anchorErrorMessages && logInfo.anchorErrorMessages.length > 0) {
        const message = logInfo.anchorErrorMessages[0]
        const ixIndex = extractInstructionIndex(error)
        return formatWithInstructionIndex(message, ixIndex)
    }

    // 2B. Priority 1: Hints from logs (detailed messages)
    // Example: "Insufficient funds: have 0.0085 SEV, need 5.0000 SEV"
    if (logInfo.hints.length > 0) {
        return logInfo.hints[0]
    }

    // 2C. Priority 2: Check Anchor constraints
    if (logInfo.anchorConstraints.length > 0) {
        const constraint = logInfo.anchorConstraints[0]

        // Translation key mapping
        const constraintTranslationKeys = {
            'ConstraintHasOne': 'constraintHasOne',
            'ConstraintSeeds': 'constraintSeeds',
            'ConstraintMut': 'constraintMut',
            'ConstraintSigner': 'constraintSigner',
            'ConstraintOwner': 'constraintOwner'
        }

        // Fallback messages in English
        const constraintFallbacks = {
            'ConstraintHasOne': 'Authority or ownership verification failed - wrong authority provided',
            'ConstraintSeeds': 'Account derivation failed - incorrect PDA seeds',
            'ConstraintMut': 'Account must be mutable',
            'ConstraintSigner': 'Account must sign the transaction',
            'ConstraintRaw': 'Custom constraint check failed',
            'ConstraintOwner': 'Account has incorrect owner',
            'ConstraintRentExempt': 'Account must be rent exempt',
            'ConstraintSpace': 'Account data space incorrect',
            'ConstraintClose': 'Account close constraint failed'
        }

        const translationKey = constraintTranslationKeys[constraint]
        const message = translationKey
            ? (t(translationKey) || constraintFallbacks[constraint])
            : (constraintFallbacks[constraint] || `Anchor constraint failed: ${constraint}`)

        const ixIndex = extractInstructionIndex(error)
        return formatWithInstructionIndex(message, ixIndex)
    }

    // 2D. Program errors from logs
    if (logInfo.programErrors.length > 0) {
        const err = logInfo.programErrors[0]
        return `Program ${err.program} failed: ${err.message}`
    }

    // 2E. Custom errors from logs
    if (logInfo.customErrors.length > 0) {
        const code = logInfo.customErrors[0]
        if (idlUrl) {
            const idl = await loadIdl(idlUrl)
            const anchorError = parseAnchorError(code, idl)
            if (anchorError) {
                return anchorError
            }
        }
        return `Custom program error: ${code} (0x${code.toString(16)})`
    }

    // 3. Check custom error code (fallback to IDL if logs didn't help)
    const customErrorCode = extractCustomErrorCode(error)
    if (customErrorCode !== null) {
        // Try to load IDL and parse Anchor error
        if (idlUrl) {
            const idl = await loadIdl(idlUrl)
            const anchorError = parseAnchorError(customErrorCode, idl)
            if (anchorError) {
                const ixIndex = extractInstructionIndex(error)
                return formatWithInstructionIndex(anchorError, ixIndex)
            }
        }

        // Fallback: show error code
        const ixIndex = extractInstructionIndex(error)
        const baseMessage = `Custom program error: ${customErrorCode} (0x${customErrorCode.toString(16)})`
        return formatWithInstructionIndex(baseMessage, ixIndex)
    }

    // 4. Last fallback
    return t('transactionSimulationFailed') ||
           `Transaction simulation failed: ${JSON.stringify(error)}`
}

/**
 * Helper function for fast error parsing without IDL
 * @param {any} error - Error object
 * @returns {string} Error message
 */
export function parseSimulationErrorSync(error) {
    if (!error) return null
    if (typeof error === 'string') {
        try {
            error = JSON.parse(error)
        } catch {
            return error
        }
    }

    const standardError = parseStandardSolanaError(error)
    if (standardError) return standardError

    const customErrorCode = extractCustomErrorCode(error)
    if (customErrorCode !== null) {
        const ixIndex = extractInstructionIndex(error)
        const baseMessage = `Custom error ${customErrorCode} (0x${customErrorCode.toString(16)})`
        return ixIndex !== null
            ? `Instruction #${ixIndex}: ${baseMessage}`
            : baseMessage
    }

    return t('transactionSimulationFailed') ||
           `Simulation failed: ${JSON.stringify(error)}`
}

/**
 * Clear IDL cache (for tests or when IDL is updated)
 */
export function clearIdlCache() {
    idlCache = null
}
