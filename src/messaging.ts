import {
  Wormhole,
  encoding,
  signSendWait,
} from "@wormhole-foundation/connect-sdk";
import { SolanaPlatform } from "@wormhole-foundation/connect-sdk-solana";
import { SolanaWormholeCore } from "@wormhole-foundation/connect-sdk-solana-core";
// required to register the protocol
import "@wormhole-foundation/connect-sdk-solana-core";

import { getStuff } from "./helpers";

(async function () {
  const wh = new Wormhole("Testnet", [SolanaPlatform]);

  const solChain = wh.getChain("Solana");
  const { signer, address } = await getStuff(solChain);

  // todo:  need to add verify msg to core interface
  const coreBridge = (await solChain.getWormholeCore()) as SolanaWormholeCore<
    "Testnet",
    "Solana"
  >;

  const [txid] = await signSendWait(
    solChain,
    coreBridge.publishMessage(
      address.address,
      encoding.bytes.encode("lol"),
      0, // nonce
      0 // consistency (0,1)
    ),
    signer
  );
  //console.log(_txids);

  // also possible to search by txid but takes longer to show up
  // e.g.
  // const vaa = await wh.getVaaByTxHash(txids[0].txid, "Uint8Array");

  const vaa = await wh.getVaa(
    (
      await solChain.parseTransaction(txid.txid)
    )[0]!,
    "Uint8Array"
  );
  if (!vaa) throw "wat";

  console.log(`Verified message: '${encoding.bytes.decode(vaa.payload!)}'`);

  const _postedTxs = await signSendWait(
    solChain,
    coreBridge.postVaa(address.address, vaa!),
    signer
  );
  //console.log(_postedTxs);

  const _rePostedTxs = await signSendWait(
    solChain,
    coreBridge.postVaa(address.address, vaa!),
    signer
  );
  //console.log(_rePostedTxs);
})();
