import fs from "node:fs";
import {
    BlockfrostProvider,
    MeshTxBuilder,
    MeshWallet,
    serializePlutusScript,
    UTxO,
    builtinByteString,
    stringToHex,
    serializeData,
    mConStr0
} from "@meshsdk/core";
import { applyParamsToScript } from "@meshsdk/core-csl";
import blueprint from "./plutus.json";
import { blake2b } from "@meshsdk/core-cst";

const blockchainProvider = new BlockfrostProvider(process.env.BLOCKFROST_PROJECT_ID!);

// wallet for signing transactions
export const wallet = new MeshWallet({
    networkId: 0,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
        type: "root",
        bech32: fs.readFileSync("me.sk").toString(),
    },
});

export function getScript() {
    const scriptCbor = applyParamsToScript(
        blueprint.validators[0].compiledCode,
        []
    );
    const scriptAddr = serializePlutusScript(
        { code: scriptCbor, version: "V3" },
        undefined,
        0
    ).address
    return { scriptCbor, scriptAddr };
}

export function getScriptWithParams(params: any[]) {
    const scriptCbor = applyParamsToScript(
        blueprint.validators[0].compiledCode,
        params
    );

    const scriptAddr = serializePlutusScript(
        { code: scriptCbor, version: "V3" },
    ).address;

    return { scriptCbor, scriptAddr };

}

// reusable function to get a transaction builder
export function getTxBuilder() {
    return new MeshTxBuilder({
        fetcher: blockchainProvider,
        submitter: blockchainProvider,
    });
}

// reusable function to get a UTxO by transaction hash
export async function getUtxoByTxHash(txHash: string): Promise<UTxO> {
    const utxos = await blockchainProvider.fetchUTxOs(txHash);
    if (utxos.length === 0) {
        throw new Error("UTxO not found");
    }
    return utxos[0];
}

export const uniqueTokenName = (txHash: string, outputIndex: number): string => {
    const outrefCbor = serializeData(mConStr0([txHash, outputIndex]), "Mesh");
    const hash = blake2b(32).update(Buffer.from(outrefCbor, "hex")).digest("hex");
    return hash;
}

export const wallet2 = new MeshWallet({
    networkId: 0,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
        type: "root",
        bech32: fs.readFileSync("me2.sk").toString(),
    },
});