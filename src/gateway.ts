import {
  GatewayTransfer,
  GatewayTransferDetails,
  TokenId,
  Wormhole,
  amount,
} from "@wormhole-foundation/sdk";
import { cosmwasm } from "@wormhole-foundation/sdk/cosmwasm";
import { evm } from "@wormhole-foundation/sdk/evm";
import { solana } from "@wormhole-foundation/sdk/solana";

import { getStuff } from "./helpers";

(async function () {
  const wh = new Wormhole("Mainnet", [
    evm.Platform,
    solana.Platform,
    cosmwasm.Platform,
  ]);

  // Grab chain Contexts for each leg of our journey
  const srcCtx = wh.getChain("Solana");
  const dstCtx = wh.getChain("Dymension");

  // Get signer from local key but anything that implements
  // Signer interface (e.g. wrapper around web wallet) should work
  const srcStuff = await getStuff(srcCtx);
  const dstStuff = await getStuff(dstCtx);

  // we'll use the native token on the source chain
  const token: TokenId = Wormhole.tokenId(srcCtx.chain, "native");
  const amt = amount.units(
    amount.parse("0.001", srcCtx.config.nativeTokenDecimals)
  );

  console.log(
    `Beginning transfer into Cosmos from ${
      srcCtx.chain
    }:${srcStuff.address.address.toString()} to ${
      dstStuff.chain.chain
    }:${dstStuff.address.address.toString()}`
  );

  const xfer = await GatewayTransfer.from(wh, {
    token: token,
    amount: amt,
    from: srcStuff.address,
    to: dstStuff.address,
  } as GatewayTransferDetails);
  console.log("Created GatewayTransfer: ", xfer.transfer);

  const srcTxIds = await xfer.initiateTransfer(srcStuff.signer);
  console.log("Started transfer on source chain", srcTxIds);

  const attests = await xfer.fetchAttestation(600_000);
  console.log("Got Attestations", attests);

  console.log("Finished!");
})();
