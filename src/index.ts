import { Wormhole } from "@wormhole-foundation/connect-sdk";
import { EvmPlatform } from "@wormhole-foundation/connect-sdk-evm";
import { SolanaPlatform } from "@wormhole-foundation/connect-sdk-solana";
import { getStuff } from "./helpers";

(async function () {
  const wh = new Wormhole("Testnet", [EvmPlatform, SolanaPlatform]);

  // Get signers
  const { signer: fromSigner, address: fromAddress } = await getStuff(
    wh.getChain("Avalanche")
  );
  const { signer: toSigner, address: toAddress } = await getStuff(
    wh.getChain("Solana")
  );

  // Make (manual) a token transfer
  const xfer = await wh.tokenTransfer(
    "native",
    1_000_000_000_000n,
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
})();
