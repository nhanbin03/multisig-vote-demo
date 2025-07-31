use aiken/collection/dict
use aiken/collection/list
use aiken/crypto.{Blake2b_224, Hash, VerificationKey}
use cardano/address.{Script}
use cardano/assets.{PolicyId, policies}
use cardano/governance.{DelegateRepresentative, Voter}
use cardano/transaction.{InlineDatum, OutputReference, Transaction}

pub type PubKeyHash =
  Hash<Blake2b_224, VerificationKey>

pub type MultisigDatum {
  signers: List<PubKeyHash>,
  threshold: Int,
}

// pub type VoteRedeemer {
// }

pub type MintRedeemer {
  Minting
  Burning
}

validator multisigvote(token_name: ByteArray, utxo_ref: OutputReference) {
  mint(redeemer: MintRedeemer, policy_id: PolicyId, self: Transaction) {
    let Transaction { inputs, mint, .. } = self
    expect [Pair(asset_name, amount)] =
      mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()
    when redeemer is {
      Minting -> {
        expect Some(_input) =
          list.find(inputs, fn(input) { input.output_reference == utxo_ref })
        amount == 1 && asset_name == token_name
      }
      Burning -> amount == -1 && asset_name == token_name
    }
  }

  vote(_redeemer, voter: Voter, self: Transaction) {
    // let Transaction { inputs, outputs, .. } = self

    // expect DelegateRepresentative(own_credential) = voter
    // expect Script(own_script_hash) = own_credential

    // // One input should hold the STT, with the expected format.
    // expect Some(stt_input) =
    //   list.find(
    //     inputs,
    //     fn(input) { list.has(policies(input.output.value), own_script_hash) },
    //   )
    // expect InlineDatum(input_datum) = stt_input.output.datum
    // expect multisig_datum: MultisigDatum = input_datum
    True
  }

  publish(_r, _c, _t) {
    True
  }

  else(_) {
    fail
  }
}
