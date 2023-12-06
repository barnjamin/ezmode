import {
  CONFIG,
  Chain,
  TokenId,
  Wormhole,
  nativeChainAddress,
  signSendWait,
} from "@wormhole-foundation/connect-sdk";
import { EvmPlatform } from "@wormhole-foundation/connect-sdk-evm";
import { SolanaPlatform } from "@wormhole-foundation/connect-sdk-solana";
import { getStuff } from "./helpers";

import "@wormhole-foundation/connect-sdk-evm-tokenbridge";
import "@wormhole-foundation/connect-sdk-solana-tokenbridge";

(async function () {
  let conf = { ...CONFIG["Testnet"] };
  conf.chains.Sepolia!.rpc = "https://ethereum-sepolia.publicnode.com";
  const wh = new Wormhole("Testnet", [EvmPlatform, SolanaPlatform], conf);

  // Original chain and address
  const origin = "Sepolia";
  const tokenAddress = "0xeef12a83ee5b7161d3873317c8e0e7b76e0b5d9c";
  const token: TokenId = nativeChainAddress(origin, tokenAddress);

  // List of chains we want to attest on
  const destinationChains: Chain[] = ["Solana"];

  // grab context and signer
  const origChain = wh.getChain(token.chain);
  const { signer: origSigner } = await getStuff(origChain);

  // Note: if the VAA is not produced before the attempt to retrieve it times out
  // you should set this value to the txid logged in the previous run
  // e.g.
  // let txid = "0xfbc753f45173448c92567b09a4e223b30ff40f0a2d3cc9f11e0377c774d1501c";
  let txid: string =
    "0x55127b9c8af46aaeea9ef28d8bf91e1aff920422fc1c9831285eb0f39ddca2fe";
  // "0x04fbe9a353713d5aae2917144a859f76cb3a15096bcb11adfaca2a1bb8c681d3";

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
    // try {
    //   // try to get the wrapped version, an error here likely means
    //   // its not been attested
    //   const wrapped = await tb.getWrappedAsset(token);
    //   console.log("already wrapped");
    //   return { chain, wrapped: wrapped.toUniversalAddress().toString() };
    // } catch (e) {}

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
    return { chain, wrapped: wrapped.toUniversalAddress().toString() };
  });

  const results = await Promise.all(resultPromises);
  console.log(results);
})();
