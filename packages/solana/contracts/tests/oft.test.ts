import * as anchor from '@coral-xyz/anchor'
import {
    TOKEN_PROGRAM_ID,
    createInitializeMintInstruction,
    getMintLen,
    getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token'
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { assert } from 'chai'
import { OftTools } from '@layerzerolabs/lz-solana-sdk-v2'
import oftIdl from '../target/idl/oft.json'
import endpointIdl from '../target/idl/endpoint.json'
import { addressToBytes32 } from '@layerzerolabs/lz-v2-utilities'
import { Options } from '@layerzerolabs/lz-v2-utilities'

const OFT_SEED = 'Oft'
const SOLANA_OFT_TOKEN_DECIMALS = 8
const OFT_SHARE_DECIMALS = 6

const peer = { dstEid: 40231, peerAddress: addressToBytes32('0x010425EC6E7beC3A92c8220cE2237497AD762E63') }

// TRY WITH  { commitment: `finalized` }

describe('oft', () => {
    // Configure the client to use the local cluster.
    // const provider = anchor.AnchorProvider.local(undefined, {
    //     commitment: 'confirmed',
    //     preflightCommitment: 'confirmed',
    // })
    // const wallet = provider.wallet as anchor.Wallet

    //console.log(Buffer.from(peers[0].peerAddress).toString('hex'))

    const provider = anchor.AnchorProvider.env()
    anchor.setProvider(provider)
    const wallet = provider.wallet as anchor.Wallet
    const OFT_PROGRAM_ID = new PublicKey(oftIdl.metadata.address)
    const ENDPOINT_PROGRAM_ID = new PublicKey(endpointIdl.metadata.address)

    it('Initialize OFT', async () => {
        const mintKp = Keypair.generate()
        const [oftConfigPda] = PublicKey.findProgramAddressSync(
            [Buffer.from(OFT_SEED, 'utf8'), mintKp.publicKey.toBuffer()],
            new anchor.web3.PublicKey(oftIdl.metadata.address)
        )

        // step 1, create the mint token
        const createMintIxs = [
            SystemProgram.createAccount({
                fromPubkey: wallet.publicKey,
                newAccountPubkey: mintKp.publicKey,
                space: getMintLen([]),
                lamports: await provider.connection.getMinimumBalanceForRentExemption(getMintLen([])),
                programId: TOKEN_PROGRAM_ID,
            }),
            createInitializeMintInstruction(mintKp.publicKey, SOLANA_OFT_TOKEN_DECIMALS, oftConfigPda, oftConfigPda),
        ]
        await provider.sendAndConfirm(new anchor.web3.Transaction().add(...createMintIxs), [wallet.payer, mintKp])

        // step 2, create the OFT token
        const initOftIx = await OftTools.createInitNativeOftIx(
            wallet.publicKey,
            wallet.publicKey,
            mintKp.publicKey,
            wallet.publicKey,
            OFT_SHARE_DECIMALS,
            TOKEN_PROGRAM_ID,
            OFT_PROGRAM_ID,
            ENDPOINT_PROGRAM_ID
        )
        await provider.sendAndConfirm(new anchor.web3.Transaction().add(initOftIx), [wallet.payer])

        // check status
        const delegate = await OftTools.getDelegate(provider.connection, oftConfigPda, ENDPOINT_PROGRAM_ID)
        assert.equal(delegate.toBase58(), wallet.publicKey.toBase58())

        // step 3, set the peers
        const setPeerIx = await OftTools.createSetPeerIx(
            wallet.publicKey, // admin
            oftConfigPda, // oft config account
            peer.dstEid, // destination endpoint id
            peer.peerAddress // peer address
        )

        const peerSignature = await provider.sendAndConfirm(new anchor.web3.Transaction().add(setPeerIx), [
            wallet.payer,
        ])
        console.log(peerSignature) // tx id

        // // step 4, mint tokens (initial supply)

        // const amount = BigInt(100)
        // const associatedTokenAccount = (
        //     await getOrCreateAssociatedTokenAccount(
        //         provider.connection,
        //         wallet.payer,
        //         mintKp.publicKey,
        //         wallet.publicKey,
        //         false,
        //         'confirmed'
        //     )
        // ).address

        // const oftMintIx = await OftTools.createMintToIx(
        //     wallet.publicKey,
        //     mintKp.publicKey,
        //     associatedTokenAccount, // which account to mint to ?
        //     amount,
        //     TOKEN_PROGRAM_ID,
        //     OFT_PROGRAM_ID
        // )
        // const mintSignature = await provider.sendAndConfirm(
        //     new anchor.web3.Transaction().add(oftMintIx),
        //     [wallet.payer],
        //     { commitment: `finalized` }
        // )
        // console.log(mintSignature) // tx id

        // // step 5, call send
        // const fee = await OftTools.quoteWithUln(
        //     provider.connection, // your connection
        //     wallet.publicKey, // payer address
        //     mintKp.publicKey, // token mint address
        //     peer.dstEid, // destination endpoint id
        //     amount, // amount of tokens to send
        //     amount, // minimum amount of tokens to send (for slippage)
        //     Options.newOptions().addExecutorLzReceiveOption(0, 0).toBytes(), // extra options to send
        //     peer.peerAddress // receiver address
        // )

        // const sendIx = await OftTools.sendWithUln(
        //     provider.connection, // your connection
        //     wallet.publicKey, // payer address
        //     mintKp.publicKey, // token mint address
        //     associatedTokenAccount, // associated token address
        //     peer.dstEid, // destination endpoint id
        //     amount, // amount of tokens to send
        //     amount, // minimum amount of tokens to send (for slippage)
        //     Options.newOptions().addExecutorLzReceiveOption(0, 0).toBytes(), // extra options to send
        //     peer.peerAddress, // receiver address
        //     fee.nativeFee // native fee to pay (using quote)
        // )
        // const sendSignature = await provider.sendAndConfirm(new anchor.web3.Transaction().add(sendIx), [wallet.payer], {
        //     commitment: `finalized`,
        // })
        // console.log(sendSignature) // tx id
    })
})
