import {
  Chain,
  ChainAddress,
  ChainContext,
  Network,
  Signer,
  TokenTransfer,
  TransferState,
  TxHash,
  Wormhole,
  api,
  tasks,
} from "@wormhole-foundation/sdk";

import  algorand  from "@wormhole-foundation/sdk/algorand";
import  evm  from "@wormhole-foundation/sdk/evm";
import  solana  from "@wormhole-foundation/sdk/solana";
import  cosmwasm  from "@wormhole-foundation/sdk/cosmwasm";

function getEnv(key: string): string {
  // If we're in the browser, return empty string
  if (typeof process === undefined) return "";

  // Otherwise, return the env var or error
  const val = process.env[key];
  if (!val)
    throw new Error(
      `Missing env var ${key}, did you forget to set valies in '.env'?`
    );

  return val;
}

export interface TransferStuff<N extends Network, C extends Chain> {
  chain: ChainContext<N, C>;
  signer: Signer<N, C>;
  address: ChainAddress<C>;
}

export async function getStuff<N extends Network, C extends Chain>(
  chain: ChainContext<N, C>
): Promise<TransferStuff<N, C>> {
  // read in from `.env`
  (await import("dotenv")).config();
  let signer: Signer;
  const platform = chain.platform.utils()._platform;
  switch (platform) {
    case "Evm":
      signer = await (
        await evm()
      ).getSigner(await chain.getRpc(), getEnv("ETH_PRIVATE_KEY"));
      break;
    case "Solana":
      signer = await (
        await solana()
      ).getSigner(await chain.getRpc(), getEnv("SOL_PRIVATE_KEY"), {
        // TODO: fix typing
        // for now see available options in the sdks platforms/solana/signer.ts
        computeLimit: 500_000n,
        priorityFeeAmount: 100_000n,
      });
      break;
    case "Algorand":
      signer = await (
        await algorand()
      ).getSigner(await chain.getRpc(), getEnv("ALGORAND_MNEMONIC"));
      break;
    case "Cosmwasm":
      signer = await (
        await cosmwasm()
      ).getSigner(await chain.getRpc(), getEnv("COSMOS_MNEMONIC"));
      break;
    default:
      throw new Error("Unrecognized platform: " + platform);
  }
  return {
    chain,
    signer: signer as Signer<N, C>,
    address: Wormhole.chainAddress(chain.chain, signer.address()),
  };
}

export async function waitLog<N extends Network = Network>(
  wh: Wormhole<N>,
  xfer: TokenTransfer<N>,
  tag: string = "WaitLog"
) {
  const tracker = TokenTransfer.track(wh, TokenTransfer.getReceipt(xfer));
  let receipt;
  for await (receipt of tracker) {
    console.log(
      `${tag}: Current trasfer state: `,
      TransferState[receipt.state]
    );
  }
  return receipt;
}

// Note: This API may change but it is currently the best place to pull
// the relay status from
export async function waitForRelay(
  txid: TxHash
): Promise<api.RelayData | null> {
  const relayerApi = "https://relayer.dev.stable.io";
  const task = () => api.getRelayStatus(relayerApi, txid);
  return tasks.retry<api.RelayData>(
    task,
    5000,
    60 * 1000,
    "Wormhole:GetRelayStatus"
  );
}
