import {
  Chain,
  CircleTransfer,
  Network,
  Signer,
  TransactionId,
  Wormhole,
  amount,
  wormhole,
} from "@wormhole-foundation/sdk";
import evm from "@wormhole-foundation/sdk/evm";
import solana from "@wormhole-foundation/sdk/solana";

import { TransferStuff, getStuff, waitForRelay } from "./helpers";

/*
Notes:
Only a subset of chains are supported by Circle for CCTP, see core/base/src/constants/circle.ts for currently supported chains

AutoRelayer takes a 0.1usdc fee when xfering to any chain beside goerli, which is 1 usdc
*/

(async function () {
  // init Wormhole object, passing config for which network
  // to use (e.g. Mainnet/Testnet) and what Platforms to support
  const wh = await wormhole("Testnet", [evm, solana]);

  // Grab chain Contexts
  const sendChain = wh.getChain("Solana");
  const rcvChain = wh.getChain("Avalanche");

  // Get signer from local key but anything that implements
  // Signer interface (e.g. wrapper around web wallet) should work
  const source = await getStuff(sendChain);
  const destination = await getStuff(rcvChain);

  // 6 decimals for USDC (except for bsc, so check decimals before using this)
  const amt = amount.units(amount.parse("0.01", 6));

  // Choose whether or not to have the attestation delivered for you
  const automatic = false;

  // If the transfer is requested to be automatic, you can also request that
  // during redemption, the receiver gets some amount of native gas transferred to them
  // so that they may pay for subsequent transactions
  // The amount specified here is denominated in the token being transferred (USDC here)
  const _nativeGasAmt = "0.01";
  const nativeGas = automatic
    ? amount.units(amount.parse(_nativeGasAmt, 6))
    : 0n;

  // Automatic Circle USDC CCTP Transfer
  const fee = !automatic
    ? 0n
    : await sendChain
        .getAutomaticCircleBridge()
        .then((acb) => acb.getRelayerFee(rcvChain.chain));

  await cctpTransfer(wh, source, destination, {
    amount: amt + fee,
    automatic,
    nativeGas,
  });

  // Note: you can pick up a partial transfer from the origin chain name and txid
  // once created, you can call `fetchAttestations` and `completeTransfer` assuming its a manual transfer.
  // This is especially helpful for chains with longer time to finality where you don't want
  // to have to wait for the attestation to be generated.
  // await completeTransfer(
  //   wh,
  //   {
  //     chain: sendChain.chain,
  //     txid: "0xfe374b6e3ea032c05eb244e5c310047bc779f5cc389a2a0e3fccbf07fb2ae8a2",
  //   },
  //   destination.signer,
  // );
})();

async function cctpTransfer<N extends Network>(
  wh: Wormhole<N>,
  src: TransferStuff<N, Chain>,
  dst: TransferStuff<N, Chain>,
  req: {
    amount: bigint;
    automatic: boolean;
    nativeGas?: bigint;
  }
) {
  const xfer = await wh.circleTransfer(
    req.amount,
    src.address,
    dst.address,
    req.automatic,
    undefined,
    req.nativeGas
  );
  console.log(xfer);

  const quote = await CircleTransfer.quoteTransfer(
    src.chain,
    dst.chain,
    xfer.transfer
  );
  console.log("Quote", quote);

  console.log("Starting Transfer");
  const srcTxids = await xfer.initiateTransfer(src.signer);
  console.log(`Started Transfer: `, srcTxids);

  if (req.automatic) {
    const relayStatus = await waitForRelay(srcTxids[srcTxids.length - 1]!);
    console.log(`Finished relay: `, relayStatus);
    return;
  }

  console.log("Waiting for Attestation");
  const attestIds = await xfer.fetchAttestation();
  console.log(`Got Attestation: `, attestIds);

  console.log("Completing Transfer");
  const dstTxids = await xfer.completeTransfer(dst.signer);
  console.log(`Completed Transfer: `, dstTxids);
}

export async function completeTransfer(
  wh: Wormhole<Network>,
  txid: TransactionId,
  signer: Signer
): Promise<void> {
  // Rebuild the transfer from the source txid
  const xfer = await CircleTransfer.from(wh, txid);

  const attestIds = await xfer.fetchAttestation(60 * 60 * 1000);
  console.log("Got attestation: ", attestIds);

  const dstTxIds = await xfer.completeTransfer(signer);
  console.log("Completed transfer: ", dstTxIds);
}
