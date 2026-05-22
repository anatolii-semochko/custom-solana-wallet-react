import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
    PublicKey,
    SystemProgram,
    SystemInstruction,
    Transaction,
    VersionedTransaction,
    TransactionMessage,
    ComputeBudgetProgram,
    AddressLookupTableAccount,
} from '@solana/web3.js'
import { parseSimulationError } from './errorParser'

const PROGRAM_IDS = {
    SYSTEM: SystemProgram.programId.toBase58(),
    TOKEN: TOKEN_PROGRAM_ID.toBase58(),
    TOKEN_2022: TOKEN_2022_PROGRAM_ID.toBase58(),
    ATA: ASSOCIATED_TOKEN_PROGRAM_ID.toBase58(),
}

// Resolve Address Lookup Tables and account keys
async function resolveAccountKeys(connection, v0Message) {
    const lookups = v0Message.addressTableLookups || []
    if (lookups.length === 0) {
        return v0Message.getAccountKeys()
    }

    const altAccounts = await Promise.all(
        lookups.map(async (l) => {
            const acc = await connection.getAddressLookupTable(l.accountKey)
            return acc.value || new AddressLookupTableAccount({
                key: l.accountKey,
                state: { addresses: [] },
            })
        }),
    )

    return v0Message.getAccountKeys({
        accountKeysFromLookups: {
            writable: altAccounts.flatMap((a) => a.state.addresses),
            readonly: [],
        },
    })
}

// Extract Compute Budget settings from instructions
function extractComputeBudgetSettings(v0Message, accountKeys) {
    const instructions = v0Message.compiledInstructions || v0Message.instructions || []
    let cuLimit = null
    let cuPriceMicroLamports = null

    for (const ix of instructions) {
        const programId = accountKeys.get(ix.programIdIndex)
        if (programId.toBase58() === ComputeBudgetProgram.programId.toBase58()) {
            const data = Buffer.from(ix.data)
            const tag = data[0]

            if (tag === 0x02 && data.length >= 5) {
                cuLimit = data.readUInt32LE(1)
            } else if (tag === 0x03 && data.length >= 9) {
                const lo = data.readUInt32LE(1)
                const hi = data.readUInt32LE(5)
                cuPriceMicroLamports = hi * 2 ** 32 + lo
            }
        }
    }
    return { cuLimit, cuPriceMicroLamports }
}

async function estimateBaseFee(connection, v0Message, commitment = 'confirmed') {
    const feeResp = await connection.getFeeForMessage(v0Message, commitment)
    return feeResp?.value ?? null
}

function estimatePriorityFee(unitsConsumed, cuLimit, cuPriceMicroLamports) {
    if (!cuPriceMicroLamports) return 0
    const units = typeof unitsConsumed === 'number' ? unitsConsumed : (cuLimit || 0)
    const used = cuLimit ? Math.min(units, cuLimit) : units
    return Math.floor((Number(cuPriceMicroLamports) * used) / 1_000_000)
}

// Parse transaction instructions
function parseInstructions(v0Message, accountKeys) {
    const out = []
    const instructions = v0Message.compiledInstructions || v0Message.instructions || []

    for (const ix of instructions) {
        const programId = accountKeys.get(ix.programIdIndex)
        const prog = programId.toBase58()
        const accountIndexes = ix.accountKeyIndexes || ix.accounts || []
        const accounts = accountIndexes.map((i) => accountKeys.get(i).toBase58())

        let kind = 'unknown'
        let parsed = null

        try {
            if (prog === PROGRAM_IDS.SYSTEM) {
                const legacyIx = {
                    programId,
                    keys: accounts.map((pk) => ({
                        pubkey: new PublicKey(pk),
                        isSigner: false,
                        isWritable: true,
                    })),
                    data: Buffer.from(ix.data),
                }
                const t = SystemInstruction.decodeInstructionType(legacyIx)
                kind = `system.${t}`
                if (t === 'Transfer') {
                    const info = SystemInstruction.decodeTransfer(legacyIx)
                    parsed = {
                        from: info.fromPubkey.toBase58(),
                        to: info.toPubkey.toBase58(),
                        lamports: Number(info.lamports),
                    }
                }
            } else if (prog === PROGRAM_IDS.TOKEN || prog === PROGRAM_IDS.TOKEN_2022) {
                const data = Buffer.from(ix.data)
                const tag = data[0]
                if (tag === 3) {
                    kind = 'spl.transfer'
                    parsed = {
                        source: accounts[0],
                        mint: accounts[1],
                        destination: accounts[2],
                        amount: Number(data.readBigUInt64LE(1)),
                    }
                } else if (tag === 7) {
                    kind = 'spl.mintTo'
                    parsed = {
                        mint: accounts[0],
                        destination: accounts[1],
                        authority: accounts[2],
                        amount: Number(data.readBigUInt64LE(1)),
                    }
                } else if (tag === 8) {
                    kind = 'spl.burn'
                    parsed = {
                        account: accounts[0],
                        mint: accounts[1],
                        authority: accounts[2],
                        amount: Number(data.readBigUInt64LE(1)),
                    }
                } else {
                    kind = 'spl.unknown'
                }
            } else if (prog === PROGRAM_IDS.ATA) {
                kind = 'ata'
            } else {
                kind = 'custom'
            }
        } catch (e) {
            kind = 'unknown'
        }

        out.push({
            programId: prog,
            accounts,
            kind,
            parsed,
            rawDataBase64: Buffer.from(ix.data).toString('base64'),
        })
    }
    return out
}

// Extract SOL transfers from inner instructions
function parseInnerInstructions(innerInstructions, accountKeys) {
    const innerSolTransfers = []

    for (const inner of innerInstructions) {
        const instructions = inner.instructions || []
        for (const ix of instructions) {
            try {
                const programId = accountKeys.get(ix.programIdIndex)
                if (programId.toBase58() === PROGRAM_IDS.SYSTEM) {
                    const accountIndexes = ix.accounts || []
                    const accounts = accountIndexes.map((i) => accountKeys.get(i))
                    const legacyIx = {
                        programId,
                        keys: accounts.map((pk) => ({
                            pubkey: pk,
                            isSigner: false,
                            isWritable: true,
                        })),
                        data: Buffer.from(ix.data),
                    }

                    const type = SystemInstruction.decodeInstructionType(legacyIx)
                    if (type === 'Transfer') {
                        const info = SystemInstruction.decodeTransfer(legacyIx)
                        innerSolTransfers.push({
                            from: info.fromPubkey.toBase58(),
                            to: info.toPubkey.toBase58(),
                            lamports: Number(info.lamports),
                        })
                    }
                }
            } catch (e) {
                console.warn('Failed to parse inner instruction:', e)
            }
        }
    }

    return innerSolTransfers
}

// Build transaction summaries
function buildHighLevelSummaries(parsedIxs) {
    const solTransfers = []
    const splTransfers = []
    const mints = []
    const burns = []

    for (const ix of parsedIxs) {
        if (ix.kind === 'system.Transfer' && ix.parsed) {
            solTransfers.push({
                from: ix.parsed.from,
                to: ix.parsed.to,
                lamports: ix.parsed.lamports,
            })
        }
        if (ix.kind === 'spl.transfer' && ix.parsed) {
            splTransfers.push({
                source: ix.parsed.source,
                destination: ix.parsed.destination,
                mint: ix.parsed.mint,
                amount: ix.parsed.amount,
            })
        }
        if (ix.kind === 'spl.mintTo' && ix.parsed) {
            mints.push({
                mint: ix.parsed.mint,
                destination: ix.parsed.destination,
                amount: ix.parsed.amount,
            })
        }
        if (ix.kind === 'spl.burn' && ix.parsed) {
            burns.push({
                mint: ix.parsed.mint,
                account: ix.parsed.account,
                amount: ix.parsed.amount,
            })
        }
    }

    return { solTransfers, splTransfers, mints, burns }
}

// Convert transaction to VersionedTransaction
async function toVersioned(connection, txOrVtx) {
    if (txOrVtx instanceof VersionedTransaction) {
        return { vtx: txOrVtx, v0Message: txOrVtx.message }
    }

    if (txOrVtx instanceof Transaction) {
        if (!txOrVtx.recentBlockhash) {
            const { blockhash } = await connection.getLatestBlockhash('processed')
            txOrVtx.recentBlockhash = blockhash
        }

        if (!txOrVtx.feePayer) {
            throw new Error('Transaction.feePayer is required to analyze')
        }

        const msg = new TransactionMessage({
            payerKey: txOrVtx.feePayer,
            recentBlockhash: txOrVtx.recentBlockhash,
            instructions: txOrVtx.instructions,
        }).compileToV0Message()

        return { vtx: new VersionedTransaction(msg), v0Message: msg }
    }

    throw new Error('Unsupported transaction type')
}

// Simulate transaction and build summary
export async function simulateAndSummarize(connection, txOrVtx, opts = {}) {
    const commitment = opts.commitment || 'processed'
    const idlUrl = opts.idlUrl || null

    const { vtx, v0Message } = await toVersioned(connection, txOrVtx)
    const accountKeys = await resolveAccountKeys(connection, v0Message)
    const payer = accountKeys.get(0)?.toBase58()
    const { cuLimit, cuPriceMicroLamports } = extractComputeBudgetSettings(v0Message, accountKeys)
    const baseFee = await estimateBaseFee(connection, v0Message, commitment)

    // First simulation to get account list
    const simInitial = await connection.simulateTransaction(vtx, {
        sigVerify: false,
        replaceRecentBlockhash: true,
        commitment,
    })

    // Get all accounts involved in transaction
    const accountsToFetch = accountKeys.staticAccountKeys.map(k => k.toBase58())

    // Second simulation with accounts to get pre/post balances
    const sim = await connection.simulateTransaction(vtx, {
        sigVerify: false,
        replaceRecentBlockhash: true,
        commitment,
        innerInstructions: true,
        accounts: {
            encoding: 'base64',
            addresses: accountsToFetch
        }
    })

    const simErr = sim?.value?.err || null
    const unitsConsumed = sim?.value?.unitsConsumed ?? null
    const logs = sim?.value?.logs || []
    const returnData = sim?.value?.returnData || null
    const innerInstructions = sim?.value?.innerInstructions || []

    // Extract pre/post balances from simulation
    // accounts contains POST-balances after transaction
    // PRE-balances need to be fetched from blockchain
    let preBalances = []
    let postBalances = []

    if (sim?.value?.accounts && Array.isArray(sim.value.accounts)) {
        // POST-balances from simulation
        postBalances = sim.value.accounts.map(a => a?.lamports || 0)

        // Fetch PRE-balances from blockchain
        const accountInfos = await Promise.all(
            accountsToFetch.map(addr =>
                connection.getAccountInfo(new PublicKey(addr), commitment)
            )
        )
        preBalances = accountInfos.map(info => info?.lamports || 0)
    }

    const priorityFee = estimatePriorityFee(unitsConsumed, cuLimit, cuPriceMicroLamports)
    const parsedIxs = parseInstructions(v0Message, accountKeys)
    const { solTransfers, splTransfers, mints, burns } = buildHighLevelSummaries(parsedIxs)
    const innerSolTransfers = parseInnerInstructions(innerInstructions, accountKeys)

    // Calculate total expense for payer using balance changes
    const calculateExpense = (fee) => {
        let expense = 0

        // Approach 1: Use pre/post balances for accurate calculation
        // Payer is always first in list (index 0)
        if (preBalances.length > 0 && postBalances.length > 0) {
            const payerPreBalance = preBalances[0]
            const payerPostBalance = postBalances[0]
            const balanceChange = payerPreBalance - payerPostBalance

            // Balance change includes fee + expense, so expense = balanceChange - fee
            if (balanceChange > 0) {
                // Normal case: payer spends coins
                expense = balanceChange - (fee || 0)
                return expense
            } else if (balanceChange < 0) {
                // Rare case: payer receives coins (airdrop, claim, close account)
                return 0
            }
            // Don't return 0 if balanceChange === 0
            // May indicate failed simulation, need to parse instructions
        }

        // Approach 2: Parse instructions as fallback
        let hasTransfers = false

        solTransfers.forEach(transfer => {
            if (transfer.from === payer) {
                expense += transfer.lamports
                hasTransfers = true
            }
        })

        innerSolTransfers.forEach(transfer => {
            if (transfer.from === payer) {
                expense += transfer.lamports
                hasTransfers = true
            }
        })

        // Calculate rent for new accounts
        // If account had 0 lamports and after simulation has > 0, payer paid rent
        if (!hasTransfers && postBalances.length > 1) {
            for (let i = 1; i < Math.min(postBalances.length, preBalances.length); i++) {
                const pre = preBalances[i] || 0
                const post = postBalances[i] || 0
                // New account created (pre = 0, post > 0)
                if (pre === 0 && post > 0) {
                    expense += post
                    hasTransfers = true
                }
            }
        }

        // Approach 3: Parse logs for SOL transfers (only if previous approaches failed)
        if (expense === 0 && logs.length > 0) {
            let currentProgramInvoke = null
            let pendingTransfer = 0

            logs.forEach(log => {
                // Track System Program invocations
                if (log.includes('Program 11111111111111111111111111111111 invoke')) {
                    currentProgramInvoke = 'system'
                    pendingTransfer = 0
                }

                // Parse explicit transfers from logs
                const transferMatch = log.match(/Transfer:\s+(\d+)\s+lamports?/gi)
                if (transferMatch && currentProgramInvoke === 'system') {
                    transferMatch.forEach(match => {
                        const amountMatch = match.match(/(\d+)/)
                        if (amountMatch) {
                            pendingTransfer = parseInt(amountMatch[1])
                        }
                    })
                }

                // Parse "insufficient lamports" errors
                const insufficientMatch = log.match(/insufficient lamports \d+, need (\d+)/i)
                if (insufficientMatch) {
                    const neededAmount = parseInt(insufficientMatch[1])
                    expense += neededAmount
                    hasTransfers = true
                    pendingTransfer = 0
                }

                // Add pending transfer on success
                if (log.includes('Program 11111111111111111111111111111111 success') && pendingTransfer > 0) {
                    expense += pendingTransfer
                    hasTransfers = true
                    pendingTransfer = 0
                }

                // Reset on failure
                if (log.includes('Program 11111111111111111111111111111111 failed')) {
                    pendingTransfer = 0
                }
            })
        }

        return expense
    }

    const touched = []
    const { header } = v0Message
    for (let i = 0; i < accountKeys.staticAccountKeys.length; i++) {
        const pk = accountKeys.staticAccountKeys[i].toBase58()
        const isSigner = i < header.numRequiredSignatures
        const isWritable = i < header.numRequiredSignatures + header.numWritableSignedAccounts ||
            (i >= header.numRequiredSignatures &&
             i < header.numRequiredSignatures + header.numWritableSignedAccounts + header.numWritableUnsignedAccounts)

        touched.push({ pubkey: pk, isSigner, isWritable })
    }

    const fee = (baseFee ?? 0) + (priorityFee ?? 0)
    const expense = calculateExpense(fee)

    // Determine if expense is accurate (calculated from real balances)
    // or estimated from instructions/logs
    let expenseIsAccurate = false
    if (!simErr && preBalances.length > 0 && postBalances.length > 0) {
        const balanceChange = preBalances[0] - postBalances[0]
        // If balance changed - expense is accurate
        expenseIsAccurate = balanceChange !== 0
    }

    let income = 0
    if (preBalances.length > 0 && postBalances.length > 0) {
        const payerPreBalance = preBalances[0]
        const payerPostBalance = postBalances[0]
        const balanceChange = payerPreBalance - payerPostBalance
        if (balanceChange < 0) {
            income = Math.abs(balanceChange) + fee + expense
        }
    }

    // Parse error using universal error parser
    let errorMessage = null
    if (simErr) {
        // Pass simulation context including expense accuracy flag
        const simulationContext = {
            fee,
            baseFee,
            priorityFee,
            expense,
            expenseIsAccurate,
            preBalances,
            postBalances
        }
        errorMessage = await parseSimulationError(simErr, logs, idlUrl, simulationContext)
    }

    return {
        ok: !simErr,
        error: errorMessage,
        payer,
        recentBlockhash: v0Message.recentBlockhash,
        pay: {
            baseFee,
            priorityFee,
            fee,
            expense,
            expenseIsAccurate,
            income,
            totalCost: income - expense - fee,
            signaturesCount: header.numRequiredSignatures,
        },
        compute: {
            cuLimit,
            cuPriceMicroLamports,
            unitsConsumed,
        },
        instructions: parsedIxs,
        summaries: {
            solTransfers,
            splTransfers,
            mints,
            burns,
        },
        accountsTouched: touched,
        logs,
        returnData,
    }
}
