import {
  Chain,
  TokenId,
  Wormhole,
  signSendWait,
} from "@wormhole-foundation/sdk";
import { evm } from "@wormhole-foundation/sdk/evm";
import { solana } from "@wormhole-foundation/sdk/solana";
import { getStuff } from "./helpers";

import "@wormhole-foundation/connect-sdk-evm-tokenbridge";
import "@wormhole-foundation/connect-sdk-solana-tokenbridge";

(async function () {
  const wh = new Wormhole("Testnet", [evm.Platform, solana.Platform]);

  // Original Token to Attest
  const token: TokenId = Wormhole.chainAddress(
    "Sepolia",
    "0xeef12a83ee5b7161d3873317c8e0e7b76e0b5d9c"
  );

  // List of chains we want to attest on
  const destinationChains: Chain[] = ["Solana"];

  // grab context and signer
  const origChain = wh.getChain(token.chain);
  const { signer: origSigner } = await getStuff(origChain);

  // Note: if the VAA is not produced before the attempt to retrieve it times out
  // you should set this value to the txid logged in the previous run
  let txid = ""; // "0x55127b9c8af46aaeea9ef28d8bf91e1aff920422fc1c9831285eb0f39ddca2fe";

  if (txid === "") {
    // create attestation from origin chain, the same VAA
    // can be used across all chains
    const tb = await origChain.getTokenBridge();
    const attestTxns = tb.createAttestation(token.address);
    const txids = await signSendWait(origChain, attestTxns, origSigner);
    console.log("Created attestation: ", txids);
    txid = txids[0].txid;
  }

  // Get the wormhole message id from the transaction logs
  const [msg] = await origChain.parseTransaction(txid);

  // Get the Signed VAA from the API
  const timeout = 60_000; // 60 seconds
  const vaa = await wh.getVaa(msg, "TokenBridge:AttestMeta", timeout);
  if (!vaa)
    throw new Error(
      "VAA not found after retries exhausted, try extending the timeout"
    );

  // Map over destination chains to check if its attested and
  // if not, submit the attestation to the token bridge on the
  // destination chain
  const resultPromises = destinationChains.map(async (chain) => {
    const destChain = wh.getChain(chain);
    const { signer } = await getStuff(destChain);

    console.log(`Checking ${destChain.chain}`);

    // grab a ref to the token bridge
    const tb = await destChain.getTokenBridge();
    try {
      // try to get the wrapped version, an error here likely means
      // its not been attested
      const wrapped = await tb.getWrappedAsset(token);
      console.log("already wrapped");
      return { chain, address: wrapped };
    } catch (e) {}

    // no wrapped asset, needs to be attested
    console.log("attesting asset");
    await signSendWait(
      destChain,
      tb.submitAttestation(
        vaa,
        Wormhole.parseAddress(signer.chain(), signer.address())
      ),
      signer
    );

    console.log("Waiting a few seconds before checking");
    await new Promise((r) => setTimeout(r, 5000));

    // check again
    const wrapped = await tb.getWrappedAsset(token);
    return { chain, address: wrapped };
  });

  const results = await Promise.all(resultPromises);
  console.log(results);
})();
