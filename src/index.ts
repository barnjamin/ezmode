import { Wormhole, normalizeAmount } from "@wormhole-foundation/connect-sdk";
import { EvmPlatform } from "@wormhole-foundation/connect-sdk-evm";
import { SolanaPlatform } from "@wormhole-foundation/connect-sdk-solana";
import { getStuff } from "./helpers";

(async function () {
  const wh = new Wormhole("Testnet", [EvmPlatform, SolanaPlatform]);

  const origin = wh.getChain("Avalanche");
  const destination = wh.getChain("Solana");
  // Get signers

  const { signer: fromSigner, address: fromAddress } = await getStuff(origin);
  const { signer: toSigner, address: toAddress } = await getStuff(destination);

  const token = "native";
  const amt = normalizeAmount(
    "0.01",
    BigInt(origin.config.nativeTokenDecimals)
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
