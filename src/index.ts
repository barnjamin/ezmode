import { Wormhole, Context, Network } from "@wormhole-foundation/connect-sdk";
import { EvmContext } from "@wormhole-foundation/connect-sdk-evm";
import { SolanaContext } from "@wormhole-foundation/connect-sdk-solana";

(async function () {
  const NETWORK = Network.MAINNET;
  const contexts = {
    [Context.EVM]: EvmContext,
    [Context.SOLANA]: SolanaContext,
  };

  const wormholeSDK = new Wormhole(NETWORK, contexts);
  const receipt = wormholeSDK.startTransfer(
    "native",
    100n, // amount
    "solana", // sending chain
    "...", // sender address
    "ethereum", // destination chain
    "..." // recipient address on destination chain
  );

  //
})();
