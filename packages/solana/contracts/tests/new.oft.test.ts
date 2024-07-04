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
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js'
import { assert } from 'chai'
import { OftTools } from '@layerzerolabs/lz-solana-sdk-v2'
import oftIdl from '../target/idl/oft.json'
import endpointIdl from '../target/idl/endpoint.json'
import { addressToBytes32 } from '@layerzerolabs/lz-v2-utilities'
import { Options } from '@layerzerolabs/lz-v2-utilities'
import { getKeypairFromEnvironment, getExplorerLink } from '@solana-developers/helpers'

// Checks the balance to confirm connection.
async function logBalance(connection: Connection, publicKey: PublicKey, label: string = '') {
    const balance = await connection.getBalance(publicKey)
    console.log(`${label} Balance (${publicKey.toBase58()}): ${balance / 1e9} SOL`)
}

describe('oft', () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env()
    anchor.setProvider(provider)
    const wallet = provider.wallet as anchor.Wallet
    const connection = provider.connection

    // CONSTANTS

    const peer = { eid: 40231, peerAddress: addressToBytes32('0x010425EC6E7beC3A92c8220cE2237497AD762E63') }
    const OFT_SEED = 'Oft'
    // Generate SPL TOKEN Mint Keypair
    const mintKeyPair = Keypair.generate()
    // Number of decimals for the token (recommended value is 6)
    const OFT_DECIMALS = 6

    const OFT_PROGRAM_ID = new PublicKey(oftIdl.metadata.address)
    const ENDPOINT_PROGRAM_ID = new PublicKey(endpointIdl.metadata.address)
    const AMOUNT = BigInt(1000000000000)

    it('Initialize OFT', async () => {
        //
        // 1. MINT NEW SPL TOKEN
        //

        const minimumBalanceForMint = await connection.getMinimumBalanceForRentExemption(getMintLen([]))
        let transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: wallet.publicKey,
                newAccountPubkey: mintKeyPair.publicKey,
                space: getMintLen([]),
                lamports: minimumBalanceForMint,
                programId: TOKEN_PROGRAM_ID,
            }),
            createInitializeMintInstruction(
                mintKeyPair.publicKey, // mint public key
                OFT_DECIMALS, // decimals
                wallet.publicKey, // mint authority
                null, // freeze authority (not used here)
                TOKEN_PROGRAM_ID // token program id
            )
        )

        await logBalance(connection, wallet.publicKey, 'User')
        await logBalance(connection, mintKeyPair.publicKey, 'Mint Account')
        const tokenMint = await sendAndConfirmTransaction(connection, transaction, [wallet.payer, mintKeyPair], {
            commitment: `finalized`,
        })
        console.log(`Mint account tx: `, tokenMint)

        // mint initial supply
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            wallet.payer,
            mintKeyPair.publicKey,
            wallet.publicKey
        )

        const oftMint = await mintTo(
            connection,
            wallet.payer,
            mintKeyPair.publicKey,
            tokenAccount.address,
            wallet.publicKey,
            AMOUNT
        )
        console.log(`Mint tokens tx: `, oftMint)

        //
        // 2. Create a new tx to transfer mint authority to OFT Config Account and initialize a new native OFT
        //

        const [oftConfig] = PublicKey.findProgramAddressSync(
            [Buffer.from(OFT_SEED, 'utf8'), mintKeyPair.publicKey.toBuffer()],
            new anchor.web3.PublicKey(oftIdl.metadata.address)
        )
        console.log(`OFT config pda: `, oftConfig)

        console.log(`${TOKEN_PROGRAM_ID}`, `${OFT_PROGRAM_ID}`, `${ENDPOINT_PROGRAM_ID}`)

        transaction = new Transaction().add(
            createSetAuthorityInstruction(
                mintKeyPair.publicKey, // mint public key
                wallet.publicKey, // current authority
                AuthorityType.MintTokens, // authority type
                oftConfig // new authority
            ),
            await OftTools.createInitNativeOftIx(
                wallet.publicKey, // payer
                wallet.publicKey, // admin
                mintKeyPair.publicKey, // mint account
                wallet.publicKey, // OFT Mint Authority
                OFT_DECIMALS,
                TOKEN_PROGRAM_ID,
                OFT_PROGRAM_ID, // OFT Program ID that I deployed
                ENDPOINT_PROGRAM_ID
            )
        )

        const oftSignature = await sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
            commitment: `finalized`,
        })
        console.log(`OFT init tx: `, oftSignature)

        // another mint, now through oft

        const oftMintTransaction = new Transaction().add(
            await OftTools.createMintToIx(
                wallet.publicKey,
                mintKeyPair.publicKey,
                tokenAccount.address, // which account to mint to?
                AMOUNT,
                TOKEN_PROGRAM_ID,
                OFT_PROGRAM_ID
            )
        )

        // Send the transaction to mint the OFT tokens
        const oftMintSignature = await sendAndConfirmTransaction(connection, oftMintTransaction, [wallet.payer], {
            commitment: `finalized`,
        })
        console.log(oftMintSignature)

        // //
        // // 3. Peer
        // //

        // // a) peer account
        // const peerTransaction = new Transaction().add(
        //     await OftTools.createInitNonceIx(wallet.publicKey, peer.eid, oftConfig, peer.peerAddress)
        // )
        // const peerSignature = await sendAndConfirmTransaction(connection, peerTransaction, [wallet.payer], {
        //     commitment: `finalized`,
        // })
        // console.log(peerSignature)

        // // b) send library for the pathway
        // const initSendLibraryTransaction = new Transaction().add(
        //     await OftTools.createInitSendLibraryIx(wallet.publicKey, oftConfig, peer.eid)
        // )

        // const initSendLibrarySignature = await sendAndConfirmTransaction(
        //     connection,
        //     initSendLibraryTransaction,
        //     [wallet.payer],
        //     { commitment: `finalized` }
        // )
        // console.log(initSendLibrarySignature)

        // // c) receive library for the pathway
        // const initReceiveLibraryTransaction = new Transaction().add(
        //     await OftTools.createInitReceiveLibraryIx(wallet.publicKey, oftConfig, peer.eid)
        // )
        // const initReceiveLibrarySignature = await sendAndConfirmTransaction(
        //     connection,
        //     initReceiveLibraryTransaction,
        //     [wallet.payer],
        //     { commitment: `finalized` }
        // )
        // console.log(initReceiveLibrarySignature)

        // // d) init OFT Config for the pathway
        // const initConfigTransaction = new Transaction().add(
        //     await OftTools.createInitConfigIx(wallet.publicKey, oftConfig, peer.eid, peer.sendLibrary)
        // )

        // const initConfigSignature = await sendAndConfirmTransaction(connection, initConfigTransaction, [wallet.payer], {
        //     commitment: `finalized`,
        // })
        // console.log(
        //     `✅ You initialized the config for dstEid ${peer.eid}! View the transaction here: ${initConfigSignature}`
        // )
    })
})
