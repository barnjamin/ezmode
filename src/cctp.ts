import {
  CCTPTransfer,
  Wormhole,
  normalizeAmount,
} from "@wormhole-foundation/connect-sdk";
import { EvmPlatform } from "@wormhole-foundation/connect-sdk-evm";
import { getStuff } from "./helpers";

/*
Notes:
- Only a subset of chains are supported by Circle for CCTP, see core/base/src/constants/circle.ts for currently supported chains
- AutoRelayer takes a 0.1usdc fee when xfering to any chain beside goerli, which is 1 usdc
*/

(async function () {
  // init Wormhole object, passing config for which network
  // to use (e.g. Mainnet/Testnet) and what Platforms to support
  const wh = new Wormhole("Testnet", [EvmPlatform]);

  const origin = wh.getChain("Avalanche");
  const destination = wh.getChain("Ethereum");

  // See https://developers.circle.com/stablecoin/docs/cctp-technical-reference#mainnet
  // for timing of attestation availablity
  const attestTimeout = 60_000; // 60 seconds

  // Get signers
  const { signer: srcSigner, address: srcAddress } = await getStuff(origin);
  const { signer: rcvSigner, address: rcvAddress } = await getStuff(
    destination
  );

  // TODO put this in config tho technically it could be pulled from
  // the chain method given the usdc token address
  // USDC has 6 decimal places (almost everywhere?)
  const amt = normalizeAmount(1, 6n);

  // Create a (Manual) transfer
  const xfer = await wh.cctpTransfer(amt, srcAddress, rcvAddress, false);

  const srcTxids = await xfer.initiateTransfer(srcSigner);
  console.log(`Started Transfer: `, srcTxids);

  const attestIds = await xfer.fetchAttestation(attestTimeout);
  console.log(`Got Attestation: `, attestIds);

  const dstTxids = await xfer.completeTransfer(rcvSigner);
  console.log(`Completed Transfer: `, dstTxids);

  // Or pick up an in-flight transfer from origin txid
  // const xfer = await CCTPTransfer.from(wh, {
  //   chain: "Avalanche",
  //   txid: "0x1e87dc369c2825e8ff0c1f40054ae0007fb31b13466b6a94033ddcd6e5680e74",
  // });
  // console.log(await xfer.completeTransfer(rcvSigner));
})();
