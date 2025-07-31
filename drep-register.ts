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
import { Cardano, DRepID, Hash28ByteBase16 } from "@meshsdk/core-cst";

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

        const { scriptAddr, scriptCbor } = getScript(tokenName, outRef);
        const drepIdCip129 = resolveScriptHashDRepId(resolveScriptHash(scriptCbor, "V3"));
        const drepIdCip105 = DRepID.cip105FromCredential({
            type: Cardano.CredentialType.ScriptHash,
            hash: Hash28ByteBase16(resolveScriptHash(scriptCbor, "V3"))
        }).toString();


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
            .txIn(...utxoToTxIn(collateral[0]!))
            // .txInScript(scriptCbor)
            .drepRegistrationCertificate(drepIdCip129)
            .certificateScript(scriptCbor, "V3")
            .certificateRedeemerValue(mConStr0([]), "Mesh")
            // .requiredSignerHash(signerHash)
            .changeAddress(walletAddress)
            .txInCollateral(...utxoToTxIn(collateral[0]!))
            .selectUtxosFrom(utxos)
            .complete();

        const unsignedTx = txBuilder.txHex;
        console.log(`Unsigned transaction: ${unsignedTx}`);

        const signedTx = await wallet.signTx(unsignedTx);
        console.log(`Signed transaction: ${signedTx}`);
        const txHash = await wallet.submitTx(signedTx);
        console.log(`Tx submitted: ${txHash}`);
    } catch (error) {
        console.error("Error registering:", error);
    }
}

main();


// run with `npx tsx vote.ts <txHashFromDeposit>`
