import {
    deserializeAddress,
    mConStr0,
    stringToHex,
    outputReference,
    resolveScriptHash,
    utxoToTxIn,
    resolveScriptHashDRepId,
    applyCborEncoding
} from "@meshsdk/core";
import { getScript, getTxBuilder, getUtxoByTxHash, wallet, wallet2 } from "./common";

async function main() { // tx minting the token: 7beca007990b25e152528406d173b029cc12026549af9c15010987e846f6c4fd
    try {
        // get utxo, collateral and address from wallet
        const utxos = await wallet.getUtxos();
        console.log(`Utxos: ${JSON.stringify(utxos, null, 2)}`);
        const walletAddress = (await wallet.getUsedAddresses())[0];
        const collateral = await wallet.getCollateral();
        console.log(`Collateral: ${JSON.stringify(collateral, null, 2)}`);

        const nftTxHash = '72e6664425e91ffb8db69c547f58e75fe8a0ac5432550729d268ce795522bd0d';
        const nftOutputIndex = 1;


        const tokenName = "MultisigVoteNft";

        // use outputReference for Plustus V2+V3
        const outRef = outputReference(nftTxHash, nftOutputIndex);

        // const { scriptAddr, scriptCbor } = getScriptWithParams([outRef]);
        const { scriptAddr, scriptCbor } = getScript();
        // const scriptAddr = 'addr_test1wrsaszfdhhtkvvlayvcqr6mdsde60fy5cdsrfj357l7guvq5mmme9';
        const drepId = resolveScriptHashDRepId(resolveScriptHash(scriptCbor, "V3"));


        // hash of the public key of the wallet, to be used in the datum
        const signerHash = deserializeAddress(walletAddress).pubKeyHash;
        const signerHash2 = deserializeAddress((await wallet2.getUsedAddresses())[0]).pubKeyHash;

        // get the utxo from the script address of the locked funds
        const txHashHoldingNft = process.argv[2]; // 60acdeedb28404a6e2e40dcc4755dc01cb7ea18abb10304ddffa1f92c56fe66f
        const nftHoldingUtxo = await getUtxoByTxHash(txHashHoldingNft);

        // build transaction with MeshTxBuilder
        const txBuilder = getTxBuilder();
        await txBuilder
            .votePlutusScriptV3() // we used plutus v3
            .readOnlyTxInReference(
                nftHoldingUtxo.input.txHash,
                nftHoldingUtxo.input.outputIndex,
            )
            .txIn(...utxoToTxIn(collateral[0]!))
            .vote(
                {
                    type: "DRep",
                    drepId: drepId,
                },
                {
                    txHash: '25a16ada4a57fd29a1ac5f62f585d923ffe3e23321512380dfd276f6c73b1451',
                    txIndex: 0,
                },
                {
                    voteKind: "Yes",
                }
            )
            .voteScript(scriptCbor)
            .voteRedeemerValue(mConStr0([]), "Mesh")
            .requiredSignerHash(signerHash)
            .requiredSignerHash(signerHash2)
            .changeAddress(walletAddress)
            .txInCollateral(...utxoToTxIn(collateral[0]!))
            .selectUtxosFrom(utxos)
            .complete();

        const unsignedTx = txBuilder.txHex;
        console.log(`Unsigned transaction: ${unsignedTx}`);

        const signedTx = await wallet.signTx(unsignedTx);
        const signedTx2 = await wallet2.signTx(signedTx, true);
        console.log(`Signed transaction: ${signedTx}`);
        const txHash = await wallet.submitTx(signedTx2);
        console.log(`Tx submitted: ${txHash}`); // 9c1b771e5585207ed2f2a691dbe859bd6b796e87090808a3abf5fee1a7358248
    } catch (error) {
        console.error("Error voting:", error);
    }
}

main();


// run with `npx tsx vote.ts <txHashFromDeposit>`
