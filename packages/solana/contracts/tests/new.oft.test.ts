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
import { OftTools } from '@layerzerolabs/lz-solana-sdk-v2'
import oftIdl from '../target/idl/oft.json'
import endpointIdl from '../target/idl/endpoint.json'
import { getExplorerLink } from '@solana-developers/helpers'
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
    // const ENDPOINT_PROGRAM_ID = new PublicKey(endpointIdl.metadata.address)

    it('Initialize OFT', async () => {
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

        // b) send library for the pathway
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

        // c) receive library for the pathway
        transaction = new Transaction().add(
            await OftTools.createInitReceiveLibraryIx(wallet.publicKey, oftConfig, peer.to.eid)
        )
        signature = await sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
            commitment: `finalized`,
        })
        console.log(
            `✅ You initialized the receive library for dstEid ${peer.to.eid}! View the transaction here: ${signature}`
        )

        // d) init OFT Config for the pathway
        transaction = new Transaction().add(
            await OftTools.createInitConfigIx(wallet.publicKey, oftConfig, peer.to.eid, peer.sendLibrary)
        )
        signature = await sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
            commitment: `finalized`,
        })
        console.log(`✅ You initialized the config for dstEid ${peer.to.eid}! View the transaction here: ${signature}`)
    })
})
