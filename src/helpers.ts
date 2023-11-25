import {
  ChainAddress,
  ChainContext,
  Network,
  Platform,
  Signer,
  TransferState,
  WormholeTransfer,
  nativeChainAddress,
} from "@wormhole-foundation/connect-sdk";

import { getEvmSigner } from "@wormhole-foundation/connect-sdk-evm/src/testing";

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

export interface TransferStuff {
  chain: ChainContext<Network, Platform>;
  signer: Signer;
  address: ChainAddress;
}

export async function getStuff(
  chain: ChainContext<Network, Platform>
): Promise<TransferStuff> {
  let signer: Signer;
  const platform = chain.platform.utils()._platform;
  switch (platform) {
    case "Evm":
      signer = await getEvmSigner(
        await chain.getRpc(),
        getEnv("ETH_PRIVATE_KEY")
      );
      break;
    default:
      throw new Error("Unrecognized platform: " + platform);
  }

  return {
    chain,
    signer,
    address: nativeChainAddress(signer.chain(), signer.address()),
  };
}

export async function waitLog(xfer: WormholeTransfer): Promise<void> {
  console.log("Checking for complete status");
  while ((await xfer.getTransferState()) < TransferState.Completed) {
    console.log("Not yet...");
    await new Promise((f) => setTimeout(f, 5000));
  }
}
