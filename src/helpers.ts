import {
  ChainAddress,
  ChainContext,
  Network,
  Platform,
  PlatformToChains,
  Signer,
  TokenTransfer,
  TransferState,
  TxHash,
  Wormhole,
  api,
  nativeChainAddress,
  tasks,
} from "@wormhole-foundation/connect-sdk";

import { testing as et } from "@wormhole-foundation/connect-sdk-evm";
import { testing as st } from "@wormhole-foundation/connect-sdk-solana";

// read in from `.env`
require("dotenv").config();

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

export interface TransferStuff<
  N extends Network,
  P extends Platform,
  C extends PlatformToChains<P> = PlatformToChains<P>
> {
  chain: ChainContext<N, P, C>;
  signer: Signer<N, C>;
  address: ChainAddress<C>;
}

export async function getStuff<
  N extends Network,
  P extends Platform,
  C extends PlatformToChains<P>
>(chain: ChainContext<N, P, C>): Promise<TransferStuff<N, P, C>> {
  let signer: Signer;
  const platform = chain.platform.utils()._platform;
  switch (platform) {
    case "Evm":
      signer = await et.getEvmSigner(
        await chain.getRpc(),
        getEnv("ETH_PRIVATE_KEY")
      );
      break;
    case "Solana":
      signer = await st.getSolanaSigner(
        await chain.getRpc(),
        getEnv("SOL_PRIVATE_KEY")
      );
      break;
    default:
      throw new Error("Unrecognized platform: " + platform);
  }
  return {
    chain,
    signer: signer as Signer<N, C>,
    address: nativeChainAddress(chain.chain, signer.address()),
  };
}

export async function waitLog(wh: Wormhole<Network>, xfer: TokenTransfer) {
  const it = TokenTransfer.track(wh, xfer);
  let res;
  for (res = await it.next(); !res.done; res = await it.next())
    console.log(
      "Current Transfer State: ",
      TransferState[res.value as TransferState]
    );
  return res.value;
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
