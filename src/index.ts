import { Wormhole, amount, wormhole } from "@wormhole-foundation/sdk";
import { evm } from "@wormhole-foundation/sdk/evm";
import { solana } from "@wormhole-foundation/sdk/solana";

import { getStuff } from "./helpers";

(async function () {
  const wh = await wormhole("Testnet", [evm, solana]);

  const origin = wh.getChain("Solana");
  const destination = wh.getChain("Avalanche");

  // Get signers
  const { signer: fromSigner, address: fromAddress } = await getStuff(origin);
  const { signer: toSigner, address: toAddress } = await getStuff(destination);

  const token = Wormhole.tokenId(origin.chain, "native");
  const amt = amount.units(
    amount.parse("0.01", origin.config.nativeTokenDecimals)
  );

  // Make (manual) a token transfer
  const xfer = await wh.tokenTransfer(
    token,
    amt,
    fromAddress,
    toAddress,
    false
  );

  const srcTxIds = await xfer.initiateTransfer(fromSigner);
  console.log("Initiated transfer with txids: ", srcTxIds);

  const attestation = await xfer.fetchAttestation();
  console.log("Got attestation: ", attestation);

  const dstTxIds = await xfer.completeTransfer(toSigner);
  console.log("Completed transfer with txids: ", dstTxIds);

  // An in-flight or completed Transfer can also be picked up from the source txid or VAA id
  // const xfer = await TokenTransfer.from(wh, {
  //   chain: "Avalanche",
  //   txid: "0xd3e0c47f8b1be828a5b1eb8a3e48bb4fc583770c698233b0524f041512307094",
  // });
  // console.log(await xfer.completeTransfer(toSigner));
})();
