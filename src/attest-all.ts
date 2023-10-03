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

  // const txid =
  //   "0xfbc753f45173448c92567b09a4e223b30ff40f0a2d3cc9f11e0377c774d1501c";

  // Note: if this throws because the origin chain is slow:
  // comment out the attestToken fn call and set txid to the one
  // logged in the previous run
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
    } catch (e) {}

    console.log("attesting asset");
    // no wrapped asset, needs to be attested
    await redeemAttest(vaa, destChain, tb, signer);

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
  txid: string
): Promise<VAA<"AttestMeta">> {
  const [msg] = await chain.parseTransaction(txid);
  const raw = await wh.getVAABytes(msg.chain, msg.emitter, msg.sequence);
  if (!raw) throw new Error(`Couldn't find VAA: ${msg}`);
  return deserialize("AttestMeta", raw);
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

async function redeemAttest<P extends PlatformName>(
  vaa: VAA<"AttestMeta">,
  c: ChainContext<P>,
  tb: TokenBridge<P>,
  s: Signer
): Promise<void> {
  const redeemTxns = tb.submitAttestation(vaa);

  const unsigned = [];
  for await (const tx of redeemTxns) {
    unsigned.push(tx);
  }

  const signed = await s.sign(unsigned);
  await c.sendWait(signed);
}
