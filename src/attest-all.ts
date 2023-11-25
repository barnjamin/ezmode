import {
  Chain,
  TokenId,
  Wormhole,
  nativeChainAddress,
  signSendWait,
} from "@wormhole-foundation/connect-sdk";
import { EvmPlatform } from "@wormhole-foundation/connect-sdk-evm";
import { getStuff } from "./helpers";

(async function () {
  const wh = new Wormhole("Testnet", [EvmPlatform]);

  // Original chain and address
  const origin = "Avalanche";
  const tokenAddress = "0x7b2d99E1D1656a820Caa5DC145c0f9E5D5976DC4";
  const token: TokenId = nativeChainAddress(origin, tokenAddress);

  // List of chains we want to attest on
  const destinationChains: Chain[] = ["Celo"];

  // grab context and signer
  const origChain = wh.getChain(token.chain);
  const { signer: origSigner } = await getStuff(origChain);

  // Note: if the VAA is not produced before the attempt to retrieve it times out
  // you should set this value to the txid logged in the previous run
  // e.g.
  // let txid = "0xfbc753f45173448c92567b09a4e223b30ff40f0a2d3cc9f11e0377c774d1501c";
  let txid: string = "";

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
  const vaa = await wh.getVaa(
    msg.chain,
    msg.emitter,
    msg.sequence,
    "TokenBridge:AttestMeta",
    timeout
  );
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
      return { chain, wrapped: wrapped.toUniversalAddress().toString() };
    } catch (e) {}

    // no wrapped asset, needs to be attested
    console.log("attesting asset");
    await signSendWait(destChain, tb.submitAttestation(vaa), signer);

    console.log("Waiting a few seconds before checking");
    await new Promise((r) => setTimeout(r, 5000));

    // check again
    const wrapped = await tb.getWrappedAsset(token);
    return { chain, wrapped: wrapped.toUniversalAddress().toString() };
  });

  const results = await Promise.all(resultPromises);
  console.log(results);
})();
