import { Asset, deserializeAddress, mConStr0, resolveScriptHash, stringToHex, outputReference, utxoToTxIn, PlutusData, serializeData, Output, OutputReference } from "@meshsdk/core";
import { getScript, getScriptWithParams, getTxBuilder, uniqueTokenName, wallet } from "./common";
import { toPlutusData } from "@meshsdk/core-cst";
import { blake2b } from "@cardano-sdk/crypto";

// 72e6664425e91ffb8db69c547f58e75fe8a0ac5432550729d268ce795522bd0d#1, tx: 77b126b853115dd25948acae5892ca34c0f0f796885488e840e2c921692d3228
async function main() {
    try {
        // get utxo and wallet address
        const utxos = await wallet.getUtxos();
        console.log(`Utxos: ${JSON.stringify(utxos, null, 2)}`);
        const collateral = await wallet.getCollateral();
        console.log(`Collateral: ${JSON.stringify(collateral, null, 2)}`);
        const walletAddress = (await wallet.getUsedAddresses())[0];

        console.log(`Wallet Address: ${walletAddress}`);

        // console.log(`Utxos: ${JSON.stringify(utxos, null, 2)}`);
        const inputTxHash = utxos[0].input.txHash;
        const inputOutputIndex = utxos[0].input.outputIndex;

        const signerHash = deserializeAddress(walletAddress).pubKeyHash;

        const tokenName = uniqueTokenName(inputTxHash, inputOutputIndex);
        // const tokenName = stringToHex("Multisig");
        console.log(`Token Name: ${tokenName}`);

        // const { scriptAddr, scriptCbor } = getScriptWithParams([outRef]);
        const { scriptAddr, scriptCbor } = getScript();
        // const scriptAddr = 'addr_test1wrsaszfdhhtkvvlayvcqr6mdsde60fy5cdsrfj357l7guvq5mmme9';
        console.log(`Script Address: ${scriptAddr}`);
        const policyId = resolveScriptHash(scriptCbor, "V3");

        const assets: Asset[] = [
            {
                unit: "lovelace",
                quantity: "2000000",
            },
            {
                unit: `${policyId}${tokenName}`,
                quantity: "1",
            }
        ];

        // build transaction with MeshTxBuilder
        const txBuilder = getTxBuilder();
        await txBuilder
            .txIn(inputTxHash, inputOutputIndex)
            .mintPlutusScriptV3()
            .mint("1", policyId, tokenName) // mint 1 token with the script hash
            .mintingScript(scriptCbor)
            .mintRedeemerValue(mConStr0([0, 0]), "Mesh")
            .txOut(scriptAddr, assets) // send assets to the script address
            .txOutInlineDatumValue(mConStr0([[deserializeAddress(walletAddress).pubKeyHash], 1])) // provide the datum where `"constructor": 0`
            .requiredSignerHash(signerHash)
            .changeAddress(walletAddress) // send change back to the wallet address
            .txInCollateral(...utxoToTxIn(collateral[0]!))
            .selectUtxosFrom(utxos)
            .complete();
        const unsignedTx = txBuilder.txHex;
        // console.log(`Unsigned transaction: ${unsignedTx}`);

        const signedTx = await wallet.signTx(unsignedTx);
        console.log(`Signed transaction: ${signedTx}`);
        const txHash = await wallet.submitTx(signedTx);
        console.log(`Tx submitted: ${txHash}`);
    } catch (error) {
        console.error("Error during transaction:", error);
    }
}

main();

// run with `npx tsx mint.ts`