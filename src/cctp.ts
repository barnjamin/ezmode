import { CCTPTransfer, Wormhole } from "@wormhole-foundation/connect-sdk";
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

  const { signer: srcSigner, address: srcAddress } = await getStuff(
    wh.getChain("Avalanche")
  );
  const { signer: rcvSigner, address: rcvAddress } = await getStuff(
    wh.getChain("Ethereum")
  );

  // const xfer = await CCTPTransfer.from(wh, {
  //   chain: "Avalanche",
  //   txid: "0xc608df52cedefdb6618511e8aae00afe8bb4fd082dd1b614da5c3f58d071b2a7",
  // });
  const xfer = await wh.cctpTransfer(1_000_000n, srcAddress, rcvAddress, false);

  const srcTxids = await xfer.initiateTransfer(srcSigner);
  console.log(`Started Transfer: `, srcTxids);

  const attestIds = await xfer.fetchAttestation();
  console.log(`Got Attestation: `, attestIds);

  const dstTxids = await xfer.completeTransfer(rcvSigner);
  console.log(`Completed Transfer: `, dstTxids);
})();
