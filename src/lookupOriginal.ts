import { Wormhole, nativeChainAddress } from "@wormhole-foundation/connect-sdk";
import { EvmPlatform } from "@wormhole-foundation/connect-sdk-evm";
import { SolanaPlatform } from "@wormhole-foundation/connect-sdk-solana";

import "@wormhole-foundation/connect-sdk-solana-core";
import "@wormhole-foundation/connect-sdk-solana-tokenbridge";

// For a given _wrapped_ token for a specific chain, look up the original token
(async function () {
  const wh = new Wormhole("Testnet", [EvmPlatform, SolanaPlatform]);

  const chain = "Solana";
  const token = wh.parseAddress(
    chain,
    "3Ftc5hTz9sG4huk79onufGiebJNDMZNL8HYgdMJ9E7JR"
  );

  console.log(token.unwrap().toString());

  const tb = await wh.getChain(chain).getTokenBridge();
  try {
    const origToken = await tb.getOriginalAsset(token);
    const nativeAddress = nativeChainAddress(
      origToken.chain,
      origToken.address.toUint8Array()
    );
    console.log(
      `Original Token: ${origToken.chain} / ${nativeAddress.address.toString()}`
    );
  } catch (e) {
    console.error("failed to get original token: ", e);
  }
})();
