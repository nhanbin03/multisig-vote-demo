import {
    deserializeAddress,
    mConStr0,
    stringToHex,
} from "@meshsdk/core";
import { getScript, getTxBuilder, getUtxoByTxHash, wallet } from "./common";

async function main() {
    try {
        // get utxo, collateral and address from wallet
        const utxos = await wallet.getUtxos();
        const walletAddress = (await wallet.getUsedAddresses())[0];
        const collateral = (await wallet.getCollateral())[0];

        const { scriptCbor } = getScript();

        // hash of the public key of the wallet, to be used in the datum
        const signerHash = deserializeAddress(walletAddress).pubKeyHash;
        // redeemer value to unlock the funds
        const message = "Hello, World!";

        // get the utxo from the script address of the locked funds
        const txHashFromDesposit = process.argv[2];
        const scriptUtxo = await getUtxoByTxHash(txHashFromDesposit);

        // build transaction with MeshTxBuilder
        const txBuilder = getTxBuilder();
        // await txBuilder
        //     .spendingPlutusScript("V3") // we used plutus v3
        //     .txIn( // spend the utxo from the script address
        //         scriptUtxo.input.txHash,
        //         scriptUtxo.input.outputIndex,
        //         scriptUtxo.output.amount,
        //         scriptUtxo.output.address
        //     )
        //     .txInScript(scriptCbor)
        //     .txInRedeemerValue(mConStr0([message])) // provide the required redeemer value `Hello, World!`
        //     // .txInDatumValue(mConStr0([message])) // No need to provide datum because it is already present in the script UTxO
        //     .txInInlineDatumPresent()
        //     .requiredSignerHash(signerHash)
        //     .changeAddress(walletAddress)
        //     .txInCollateral(
        //         collateral.input.txHash,
        //         collateral.input.outputIndex,
        //         collateral.output.amount,
        //         collateral.output.address
        //     )
        //     .selectUtxosFrom(utxos)
        //     .complete();

        // Building the transaction with reference to the script UTxO
        await txBuilder
            .spendingPlutusScript("V3") // we used plutus v3
            .txIn(
                scriptUtxo.input.txHash,
                scriptUtxo.input.outputIndex,
                scriptUtxo.output.amount,
                scriptUtxo.output.address
            )
            .spendingTxInReference('76a61e537f34a2c08ec2e67cfee41c25e45516938b517eff5ba496fdb5fa4425', 0)
            .txInRedeemerValue(mConStr0([message])) // provide the required redeemer value `Hello, World!`
            // .txInDatumValue(mConStr0([message])) // No need to provide datum because it is already present in the script UTxO
            .txInInlineDatumPresent()
            .requiredSignerHash(signerHash)
            .changeAddress(walletAddress)
            .txInCollateral(
                collateral.input.txHash,
                collateral.input.outputIndex,
                collateral.output.amount,
                collateral.output.address
            )
            .selectUtxosFrom(utxos)
            .complete();

        const unsignedTx = txBuilder.txHex;
        console.log(`Unsigned transaction: ${unsignedTx}`);

        const signedTx = await wallet.signTx(unsignedTx);
        const txHash = await wallet.submitTx(signedTx);
        console.log(`1 tADA unlocked from the contract at Tx ID: ${txHash}`);
    } catch (error) {
        console.error("Error unlocking funds:", error.replace(/\\n/g, '\n').replace(/\\"/g, '"'));
    }
}

main();


// run with `npx tsx unlock.ts <txHashFromDeposit>`
