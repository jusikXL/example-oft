import * as anchor from '@coral-xyz/anchor'
import {
    AuthorityType,
    TOKEN_PROGRAM_ID,
    createInitializeMintInstruction,
    createSetAuthorityInstruction,
    getMintLen,
    getOrCreateAssociatedTokenAccount,
    mintTo,
} from '@solana/spl-token'
import {
    ComputeBudgetProgram,
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
} from '@solana/web3.js'
import { getExplorerLink } from '@solana-developers/helpers'

import { OftTools, SetConfigType } from '@layerzerolabs/lz-solana-sdk-v2'
import { addressToBytes32, Options } from '@layerzerolabs/lz-v2-utilities'

import oftIdl from '../target/idl/oft.json'
import { solanaToArbSepConfig as peer } from './constants'

// Checks the balance to confirm connection.
async function logBalance(connection: Connection, publicKey: PublicKey, label: string = '') {
    const balance = await connection.getBalance(publicKey)
    console.log(`${label} Balance (${publicKey.toBase58()}): ${balance / 1e9} SOL`)
}

describe('oft', () => {
    // provider and connection
    const provider = anchor.AnchorProvider.env()
    anchor.setProvider(provider)
    const wallet = provider.wallet as anchor.Wallet
    const connection = provider.connection
    const cluster = 'testnet'

    // CONSTANTS
    const OFT_SEED = 'Oft'
    const OFT_DECIMALS = 6
    const OFT_PROGRAM_ID = new PublicKey(oftIdl.metadata.address)

    it('OFT', async () => {
        //
        // 1. MINT NEW SPL TOKEN
        //
        const mintKeypair = Keypair.generate()
        const AMOUNT = BigInt(1000000000000)
        // a) Create and initialize the token mint account
        const minimumBalanceForMint = await connection.getMinimumBalanceForRentExemption(getMintLen([]))
        let transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: wallet.publicKey,
                newAccountPubkey: mintKeypair.publicKey,
                space: getMintLen([]),
                lamports: minimumBalanceForMint,
                programId: TOKEN_PROGRAM_ID,
            }),
            createInitializeMintInstruction(
                mintKeypair.publicKey, // mint public key
                OFT_DECIMALS, // decimals
                wallet.publicKey, // mint authority
                null, // freeze authority (not used here)
                TOKEN_PROGRAM_ID // token program id
            )
        )
        await logBalance(connection, wallet.publicKey, 'User')
        let signature = await sendAndConfirmTransaction(connection, transaction, [wallet.payer, mintKeypair], {
            commitment: `finalized`,
        })
        console.log(`✅ Token Mint created! View the transaction here: ${getExplorerLink('tx', signature, cluster)}`)
        // b) Mint the initial supply via direct interaction with the token mint
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            wallet.payer,
            mintKeypair.publicKey,
            wallet.publicKey
        ) // derive ata
        signature = await mintTo(
            connection,
            wallet.payer,
            mintKeypair.publicKey,
            tokenAccount.address,
            wallet.publicKey,
            AMOUNT
        )
        console.log(`✅ Initial supply minted! View the transaction here: ${getExplorerLink('tx', signature, cluster)}`)
        //
        // 2. CREATE NATIVE OFT
        //
        const [oftConfig] = PublicKey.findProgramAddressSync(
            [Buffer.from(OFT_SEED, 'utf8'), mintKeypair.publicKey.toBuffer()],
            new anchor.web3.PublicKey(oftIdl.metadata.address)
        ) // derive oft config pda
        console.log(`OFT config pda: `, oftConfig)
        // a) Transfer mint authority to oft config pda, create native oft
        transaction = new Transaction().add(
            createSetAuthorityInstruction(
                mintKeypair.publicKey, // mint public key
                wallet.publicKey, // current authority
                AuthorityType.MintTokens, // authority type
                oftConfig // new authority
            ),
            await OftTools.createInitNativeOftIx(
                wallet.publicKey, // payer
                wallet.publicKey, // admin
                mintKeypair.publicKey, // mint account
                wallet.publicKey, // OFT Mint Authority
                OFT_DECIMALS,
                TOKEN_PROGRAM_ID,
                OFT_PROGRAM_ID // OFT Program ID that I deployed
            )
        )
        signature = await sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
            commitment: `finalized`,
        })
        console.log(`✅ OFT created! View the transaction here: ${getExplorerLink('tx', signature, cluster)}`)
        // b) Mint a bit more tokens now through the OFT
        transaction = new Transaction().add(
            await OftTools.createMintToIx(
                wallet.publicKey,
                mintKeypair.publicKey,
                tokenAccount.address, // which account to mint to?
                AMOUNT,
                TOKEN_PROGRAM_ID,
                OFT_PROGRAM_ID
            )
        )
        signature = await sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
            commitment: `finalized`,
        })
        console.log(
            `✅ Additional supply minted through OFT! View the transaction here: ${getExplorerLink(
                'tx',
                signature,
                cluster
            )}`
        )
        //
        // 3. Peer
        //
        // a) peer account
        transaction = new Transaction().add(
            await OftTools.createInitNonceIx(wallet.publicKey, peer.to.eid, oftConfig, peer.peerAddress)
        )
        signature = await sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
            commitment: `finalized`,
        })
        console.log(
            `✅ You initialized the peer account for dstEid ${
                peer.to.eid
            }! View the transaction here: ${getExplorerLink('tx', signature, cluster)}`
        )

        // b) initialize send library for the pathway
        transaction = new Transaction().add(
            await OftTools.createInitSendLibraryIx(wallet.publicKey, oftConfig, peer.to.eid)
        )
        signature = await sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
            commitment: `finalized`,
        })
        console.log(
            `✅ You initialized the send library for dstEid ${
                peer.to.eid
            }! View the transaction here: ${getExplorerLink('tx', signature, cluster)}`
        )

        // c) initialize receive library for the pathway
        transaction = new Transaction().add(
            await OftTools.createInitReceiveLibraryIx(wallet.publicKey, oftConfig, peer.to.eid)
        )
        signature = await sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
            commitment: `finalized`,
        })
        console.log(
            `✅ You initialized the receive library for dstEid ${
                peer.to.eid
            }! View the transaction here: ${getExplorerLink('tx', signature, cluster)}`
        )

        // d) initialize OFT Config for the pathway
        transaction = new Transaction().add(
            await OftTools.createInitConfigIx(wallet.publicKey, oftConfig, peer.to.eid, peer.sendLibrary)
        )
        signature = await sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
            commitment: `finalized`,
        })
        console.log(
            `✅ You initialized the config for dstEid ${peer.to.eid}! View the transaction here: ${getExplorerLink(
                'tx',
                signature,
                cluster
            )}`
        )

        // e) set peer
        transaction = new Transaction().add(
            await OftTools.createSetPeerIx(
                wallet.publicKey, // admin
                oftConfig, // oft config account
                peer.to.eid, // destination endpoint id
                Array.from(peer.peerAddress), // peer address
                OFT_PROGRAM_ID // Your OFT Program ID
            )
        )
        signature = await sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
            commitment: `finalized`,
        })
        console.log(
            `✅ You set the peer for dstEid ${peer.to.eid}! View the transaction here: ${getExplorerLink(
                'tx',
                signature,
                cluster
            )}`
        )
        // f) set enforced options
        transaction = new Transaction().add(
            await OftTools.createSetEnforcedOptionsIx(
                wallet.publicKey, // your admin address
                oftConfig, // your OFT Config
                peer.to.eid, // destination endpoint id for the options to apply to
                peer.sendOptions, // send options
                peer.sendAndCallOptions,
                OFT_PROGRAM_ID
            )
        )
        signature = await sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
            commitment: `finalized`,
        })
        console.log(
            `✅ You set enforced options for dstEid ${peer.to.eid}! View the transaction here: ${getExplorerLink(
                'tx',
                signature,
                cluster
            )}`
        )

        // g) set send library
        transaction = new Transaction().add(
            await OftTools.createSetSendLibraryIx(wallet.publicKey, oftConfig, peer.sendLibrary, peer.to.eid)
        )
        signature = await sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
            commitment: `finalized`,
        })
        console.log(
            `✅ You set the send library for dstEid ${peer.to.eid}! View the transaction here: ${getExplorerLink(
                'tx',
                signature,
                cluster
            )}`
        )

        // h) set receive library
        transaction = new Transaction().add(
            await OftTools.createSetReceiveLibraryIx(
                wallet.publicKey,
                oftConfig,
                peer.receiveLibraryConfig.receiveLibrary,
                peer.to.eid,
                peer.receiveLibraryConfig.gracePeriod
            )
        )
        signature = await sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
            commitment: `finalized`,
        })
        console.log(
            `✅ You set the receive library for dstEid ${peer.to.eid}! View the transaction here: ${getExplorerLink(
                'tx',
                signature,
                cluster
            )}`
        )

        // i) set executor options
        transaction = new Transaction().add(
            await OftTools.createSetConfigIx(
                connection,
                wallet.publicKey,
                oftConfig,
                peer.to.eid,
                SetConfigType.EXECUTOR,
                peer.executorConfig,
                peer.sendLibrary
            )
        )
        signature = await sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
            commitment: `finalized`,
        })
        console.log(
            `✅ Set executor configuration for dstEid ${peer.to.eid}! View the transaction here: ${getExplorerLink(
                'tx',
                signature,
                cluster
            )}`
        )

        // j) set send options
        transaction = new Transaction().add(
            await OftTools.createSetConfigIx(
                connection,
                wallet.publicKey,
                oftConfig,
                peer.to.eid,
                SetConfigType.SEND_ULN,
                peer.sendUlnConfig,
                peer.sendLibrary
            )
        )
        signature = await sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
            commitment: `finalized`,
        })
        console.log(
            `✅ Set send configuration for dstEid ${peer.to.eid}! View the transaction here: ${getExplorerLink(
                'tx',
                signature,
                cluster
            )}`
        )

        // k) set receive options
        transaction = new Transaction().add(
            await OftTools.createSetConfigIx(
                connection,
                wallet.publicKey,
                oftConfig,
                peer.to.eid,
                SetConfigType.RECEIVE_ULN,
                peer.receiveUlnConfig,
                peer.receiveLibraryConfig.receiveLibrary
            )
        )
        signature = await sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
            commitment: `finalized`,
        })
        console.log(
            `✅ Set receive configuration for dstEid ${peer.to.eid}! View the transaction here: ${getExplorerLink(
                'tx',
                signature,
                cluster
            )}`
        )

        //
        // 4. Send
        //

        const receiver = addressToBytes32('0xC37713ef41Aff1A7ac1c3D02f6f0B3a57F8A3091')

        // a) get the fee
        const fee = await OftTools.quoteWithUln(
            connection,
            wallet.publicKey, // the payer's address
            mintKeypair.publicKey, // your token mint account
            peer.to.eid, // the dstEid
            AMOUNT, // the amount of tokens to send
            AMOUNT, // the minimum amount of tokens to send (for slippage)
            Options.newOptions().addExecutorLzReceiveOption(0, 0).toBytes(), // any extra execution options to add on top of enforced
            Array.from(receiver), // the receiver's address in bytes32
            false, // payInZRO
            undefined,
            undefined,
            undefined,
            undefined,
            TOKEN_PROGRAM_ID, // SPL Token Program
            OFT_PROGRAM_ID // Your OFT Program
        )
        console.log(`Fee: ${fee}`)

        // b) send
        const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
            units: 1400000, // Number of compute units requested
        })
        transaction = new Transaction().add(
            computeBudgetIx,
            await OftTools.sendWithUln(
                connection, // your connection
                wallet.publicKey, // payer address
                mintKeypair.publicKey, // token mint address
                tokenAccount.address, // associated token address
                peer.to.eid, // destination endpoint id
                AMOUNT, // amount of tokens to send
                AMOUNT, // minimum amount of tokens to send (for slippage)
                Options.newOptions().addExecutorLzReceiveOption(0, 0).toBytes(), // extra options to send
                Array.from(receiver), // receiver address
                fee.nativeFee, // native fee to pay (using quote)
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                OFT_PROGRAM_ID
            )
        )
        signature = await sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
            commitment: `finalized`,
        })
        console.log(
            `✅ You sent ${AMOUNT} to dstEid ${peer.to.eid}! View the transaction here: ${getExplorerLink(
                'tx',
                signature,
                cluster
            )}`
        )
    })
})
