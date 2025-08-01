import { Asset, deserializeAddress, mConStr0 } from "@meshsdk/core";
import { getScript, getTxBuilder, wallet } from "./common";

async function main() {
    const assets: Asset[] = [
        {
            unit: "lovelace",
            quantity: "100000000",
        },
    ];

    // get utxo and wallet address
    const utxos = await wallet.getUtxos();
    const walletAddress = (await wallet.getUsedAddresses())[0];

    console.log(`Utxos: ${JSON.stringify(utxos, null, 2)}`);

    // const { scriptAddr } = getScript();
    const scriptAddr = 'addr_test1wrsaszfdhhtkvvlayvcqr6mdsde60fy5cdsrfj357l7guvq5mmme9';

    // hash of the public key of the wallet, to be used in the datum
    const msg = "Hello, World!";

    // build transaction with MeshTxBuilder
    const txBuilder = getTxBuilder();
    await txBuilder
        .txOut(walletAddress, assets) // send assets to the script address
        .changeAddress(walletAddress) // send change back to the wallet address
        .selectUtxosFrom(utxos)
        .complete();
    const unsignedTx = txBuilder.txHex;
    console.log(`Unsigned transaction: ${unsignedTx}`);

    const signedTx = await wallet.signTx(unsignedTx);
    const txHash = await wallet.submitTx(signedTx);
    console.log(`1 tADA locked into the contract at Tx ID: ${txHash}`);
}

main();

// run with `npx tsx lock.ts`