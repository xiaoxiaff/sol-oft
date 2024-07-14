const {
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
} = require('@solana/web3.js');

const {OftTools, OFT_SEED, OftProgram} = require('@layerzerolabs/lz-solana-sdk-v2');
const {addressToBytes32, Options } = require('@layerzerolabs/lz-v2-utilities');

const {SecretKey, TestNetConn, TokenPubKey} = require("../common")

async function main() {
    let account = Keypair.fromSecretKey(SecretKey);
    console.log(`🔑Owner public key is: ${account.publicKey.toBase58()}`);
    console.log(`🔑Token public key is: ${TokenPubKey.toBase58()}`);

    const peers = [
        {dstEid: 40231, peerAddress: addressToBytes32('0xEe124EFd323ec2e5148583b39a799ec7Cf6CD897')},
        // {dstEid: 40202, peerAddress: addressToBytes32('0x531DD61c620bD76aC6fA4f7217bc4654EdB3C353')},
    ];

    const [oftConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from(OFT_SEED), TokenPubKey.toBuffer()],
        OftProgram.OFT_DEFAULT_PROGRAM_ID,
    );

    for (const peer of peers) {
        const optionTransaction = new Transaction().add(
            await OftTools.createSetEnforcedOptionsIx(
                account.publicKey,
                oftConfig,
                peer.dstEid,
                Options.newOptions().addExecutorLzReceiveOption(500000, 0).toBytes(),
                Options.newOptions()
                    .addExecutorLzReceiveOption(500000, 0)
                    .addExecutorComposeOption(0, 500000, 0)
                    .toBytes(),
            ),
            await OftTools.createInitSendLibraryIx(
                account.publicKey,
                oftConfig,
                peer.dstEid,
            ),
            await OftTools.createInitNonceIx(
                account.publicKey,
                peer.dstEid,
                oftConfig,
                peer.peerAddress
            ),
            await OftTools.createInitConfigIx(
                account.publicKey,
                oftConfig,
                peer.dstEid
            )
        );

        const sig = await sendAndConfirmTransaction(TestNetConn, optionTransaction, [account]);
        console.log(`✅ You set options for dstEid ${peer.dstEid}! View the transaction here: ${sig}`);
    }
}

main().then(r => {})


