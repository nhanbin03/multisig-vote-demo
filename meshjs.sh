export FAUCET_ADDR=$(cardano-cli conway address build --payment-verification-key-file ~/clone/cardano-devnet/devnet/credentials/faucet.vk)

# faucet 100 ADA to `me.addr`
cardano-cli conway transaction build \
  --tx-in $(cardano-cli conway query utxo --address $FAUCET_ADDR --output-json | jq -r 'keys[0]') \
  --tx-out $(< me.addr)+100000000 \
  --change-address $FAUCET_ADDR \
  --out-file transfer.tx
cardano-cli conway transaction sign \
  --tx-file transfer.tx \
  --signing-key-file ~/clone/cardano-devnet/devnet/credentials/faucet.sk \
  --out-file transfer.tx.signed
cardano-cli conway transaction submit --tx-file transfer.tx.signed

export BLOCKFROST_PROJECT_ID=previewXMZNWyXECBjs2Ri01WpS8LlhtE8NRmPh