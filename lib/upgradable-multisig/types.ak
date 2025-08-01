use aiken/crypto.{Blake2b_224, Hash, VerificationKey}

pub type PubKeyHash =
  Hash<Blake2b_224, VerificationKey>

pub type MultisigDatum {
  signers: List<PubKeyHash>,
  threshold: Int,
}

pub type MintMultisigRedeemer {
  InitMultiSig { input_index: Int, output_index: Int }
  EndMultiSig
}

pub type SpendMultisigRedeemer {
  // Sign { input_index: Int, output_index: Int }
  Update { input_index: Int, output_index: Int }
  Remove { input_index: Int }
}
