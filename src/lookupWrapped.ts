import { Chain, TokenId, Wormhole } from "@wormhole-foundation/connect-sdk";
import { EvmPlatform } from "@wormhole-foundation/connect-sdk-evm";
import { SolanaPlatform } from "@wormhole-foundation/connect-sdk-solana";

import "@wormhole-foundation/connect-sdk-solana-core";
import "@wormhole-foundation/connect-sdk-solana-tokenbridge";

// Lookup the Wrapped version of the original token on any chain's Token Bridge
(async function () {
  const wh = new Wormhole("Testnet", [EvmPlatform, SolanaPlatform]);

  // The original token we want to find the wrapped version of
  const originalToken: TokenId = Wormhole.chainAddress(
    "Avalanche",
    "0xd00ae08403b9bbb9124bb305c09058e32c39a48c"
  );

  const chains = ["Solana"] as Chain[];

  // Fire 'em off async
  const resultPromises = chains.map(async (chain) => {
    const tb = await wh.getChain(chain).getTokenBridge();
    try {
      // If it doesn't exist, this will throw. The `hasWrappedAsset` will _not_ throw but
      // will only return a boolean
      const wrapped = await tb.getWrappedAsset(originalToken);
      return { chain, wrapped: wrapped.toUniversalAddress().toString() };
    } catch (e) {}
    return { chain, wrapped: null };
  });

  const results = await Promise.all(resultPromises);
  console.log(results);
})();
