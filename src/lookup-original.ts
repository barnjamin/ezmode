import { Wormhole, nativeChainAddress } from "@wormhole-foundation/connect-sdk";
import { EvmPlatform } from "@wormhole-foundation/connect-sdk-evm";
import { SolanaPlatform } from "@wormhole-foundation/connect-sdk-solana";

// For a given _wrapped_ token for a specific chain, look up the original token 
(async function () {
  const wh = new Wormhole("Mainnet", [EvmPlatform, SolanaPlatform]);

  const chain = "Solana";
  const token = wh.parseAddress(
    chain,
    "7VQo3HFLNH5QqGtM8eC3XQbPkJUu7nS9LeGWjerRh5Sw"
  );

  const tb = await wh.getChain(chain).getTokenBridge();
  try {
    const origToken = await tb.getOriginalAsset(token);
    const nativeAddress = nativeChainAddress([origToken.chain, origToken.address.toUint8Array()])
    console.log(`Original Token: ${origToken.chain} / ${nativeAddress.address.toString()}`);
  } catch (e) {
    console.error("failed to get original token: ", e);
  }

})();
