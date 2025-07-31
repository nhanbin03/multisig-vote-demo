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
import { getScript, getTxBuilder, getUtxoByTxHash, wallet } from "./common";

async function main() {
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
        const { scriptAddr, scriptCbor } = getScript(tokenName, outRef);
        // const scriptAddr = 'addr_test1wrsaszfdhhtkvvlayvcqr6mdsde60fy5cdsrfj357l7guvq5mmme9';
        const drepId = resolveScriptHashDRepId(resolveScriptHash(scriptCbor, "V3"));


        // hash of the public key of the wallet, to be used in the datum
        const signerHash = deserializeAddress(walletAddress).pubKeyHash;

        // get the utxo from the script address of the locked funds
        const txHashFromDesposit = process.argv[2];
        const nftHoldingUtxo = utxos.find(utxo =>
            utxo.output.amount.some(asset => asset.unit === `${resolveScriptHash(scriptCbor, "V3")}${stringToHex(tokenName)}`)
        )!;

        // build transaction with MeshTxBuilder
        const txBuilder = getTxBuilder();
        await txBuilder
            .votePlutusScriptV3() // we used plutus v3
            // .txIn(
            //     nftHoldingUtxo.input.txHash,
            //     nftHoldingUtxo.input.outputIndex,
            //     nftHoldingUtxo.output.amount,
            //     nftHoldingUtxo.output.address
            // )
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
            .changeAddress(walletAddress)
            .txInCollateral(...utxoToTxIn(collateral[0]!))
            .selectUtxosFrom(utxos)
            .complete();

        // await txBuilder
        //     .txIn(...utxoToTxIn(collateral[0]!))
        //     .txInCollateral(...utxoToTxIn(collateral[0]!))
        //     .votePlutusScriptV3()
        //     .vote(
        //         {
        //             type: "DRep",
        //             drepId: resolveScriptHashDRepId(
        //                 resolveScriptHash(
        //                     applyCborEncoding(
        //                         "5834010100323232322533300232323232324a260106012004600e002600e004600a00260066ea8004526136565734aae795d0aba201",
        //                     ),
        //                     "V3",
        //                 ),
        //             ),
        //         },
        //         {
        //             txHash:
        //                 "2cb57168ee66b68bd04a0d595060b546edf30c04ae1031b883c9ac797967dd85",
        //             txIndex: 3,
        //         },
        //         {
        //             voteKind: "Yes",
        //         },
        //     )
        //     .voteScript(
        //         applyCborEncoding(
        //             "5834010100323232322533300232323232324a260106012004600e002600e004600a00260066ea8004526136565734aae795d0aba201",
        //         ),
        //     )
        //     .voteRedeemerValue("")
        //     .requiredSignerHash(signerHash)
        //     .changeAddress(
        //         walletAddress,
        //     )
        //     .selectUtxosFrom(utxos)
        //     .complete();

        const unsignedTx = txBuilder.txHex;
        console.log(`Unsigned transaction: ${unsignedTx}`);

        const signedTx = await wallet.signTx(unsignedTx);
        console.log(`Signed transaction: ${signedTx}`);
        const txHash = await wallet.submitTx(signedTx);
        console.log(`1 tADA unlocked from the contract at Tx ID: ${txHash}`);
    } catch (error) {
        console.error("Error voting:", error);
    }
}

main();


// run with `npx tsx vote.ts <txHashFromDeposit>`
