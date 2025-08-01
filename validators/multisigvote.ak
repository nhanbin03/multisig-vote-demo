use cardano/assets.{PolicyId}
use cardano/governance.{Voter}
use cardano/transaction.{OutputReference, Transaction}
use upgradable_multisig/multisig/validation.{
  validate_end, validate_init, validate_remove, validate_update, validate_vote,
}
use upgradable_multisig/types.{
  EndMultiSig, InitMultiSig, MintMultisigRedeemer, MultisigDatum, Remove,
  SpendMultisigRedeemer, Update,
}

validator multisig {
  mint(r: MintMultisigRedeemer, own_policy: PolicyId, tx: Transaction) {
    when r is {
      InitMultiSig { input_index, output_index } ->
        validate_init(own_policy, input_index, output_index, tx)

      EndMultiSig -> validate_end(own_policy, tx)
    }
  }

  spend(
    datum_option: Option<MultisigDatum>,
    redeemer: SpendMultisigRedeemer,
    output_reference: OutputReference,
    tx: Transaction,
  ) {
    expect Some(d) = datum_option
    when redeemer is {
      // Sign { input_index, output_index } ->
      //   validate_sign(d, output_reference, input_index, output_index, tx)
      Update { input_index, output_index } ->
        validate_update(d, output_reference, input_index, output_index, tx)
      Remove { input_index } ->
        validate_remove(d, output_reference, input_index, tx)
    }
  }

  vote(_redeemer, voter: Voter, self: Transaction) {
    validate_vote(voter, self)
  }

  publish(_r, _c, _t) {
    True
  }

  else(_) {
    fail
  }
}
