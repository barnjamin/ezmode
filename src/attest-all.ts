import {
  Signer,
  ChainContext,
  TokenId,
  Wormhole,
  PlatformName,
  VAA,
  TokenBridge,
  deserialize,
  ChainName,
  TxHash,
  signSendWait,
} from "@wormhole-foundation/connect-sdk";
import { EvmPlatform } from "@wormhole-foundation/connect-sdk-evm";
import { getStuff } from "./helpers";

(async function () {
  const wh = new Wormhole("Testnet", [EvmPlatform]);

  // Original chain and address
  const origin = "Avalanche";
  const tokenAddress = "0x7b2d99E1D1656a820Caa5DC145c0f9E5D5976DC4";

  // List of chains we want to attest on
  const destinationChains: ChainName[] = ["Celo"];

  // make it nice
  const token: TokenId = {
    chain: origin,
    address: wh.parseAddress(origin, tokenAddress),
  };

  // grab context and signer
  const origChain = wh.getChain(token.chain);
  const { signer: origSigner } = await getStuff(origChain);

  // create attestation from origin chain, the same VAA
  // can be used across all chains
  const txid = await attestToken(wh, token, origSigner);

  // Note: if this throws because the origin chain is slow:
  // comment out the attestToken fn call and set txid to the one
  // logged in the previous run
  // const txid =
  //   "0xfbc753f45173448c92567b09a4e223b30ff40f0a2d3cc9f11e0377c774d1501c";
  const vaa = await getVaa(wh, origChain, txid);

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
    } catch (e) { }

    // no wrapped asset, needs to be attested
    console.log("attesting asset");
    await signSendWait(destChain, tb.submitAttestation(vaa), signer)

    console.log("Waiting a few seconds before checking");
    await new Promise((r) => setTimeout(r, 5000));

    // check again
    const wrapped = await tb.getWrappedAsset(token);
    return { chain, wrapped: wrapped.toUniversalAddress().toString() };
  });

  const results = await Promise.all(resultPromises);
  console.log(results);
})();

async function getVaa(
  wh: Wormhole,
  chain: ChainContext<PlatformName>,
  txid: string,
  timeout?: number
): Promise<VAA<"TokenBridge:AttestMeta">> {
  const [msg] = await chain.parseTransaction(txid);
  const vaa = await wh.getVAA(msg.chain, msg.emitter, msg.sequence, "TokenBridge:AttestMeta", timeout);
  if (!vaa)
    throw new Error("VAA not found after retries exhausted");
  return vaa
}

async function attestToken(
  wh: Wormhole,
  token: TokenId,
  signer: Signer
): Promise<TxHash> {
  const origChain = wh.getChain(token.chain);

  const tb = await origChain.getTokenBridge();
  const attestTxns = tb.createAttestation(token.address);
  const unsigned = [];
  for await (const tx of attestTxns) {
    unsigned.push(tx);
  }
  const signed = await signer.sign(unsigned);
  const [txid] = await origChain.sendWait(signed);

  console.log(`Attest Txid: ${txid}`);
  return txid;
}