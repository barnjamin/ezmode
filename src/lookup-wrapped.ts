import { TokenId, Wormhole, chains } from "@wormhole-foundation/connect-sdk";
import { EvmPlatform } from "@wormhole-foundation/connect-sdk-evm";
import { SolanaPlatform } from "@wormhole-foundation/connect-sdk-solana";

// Lookup the Wrapped version of the original token on any chain's Token Bridge 
(async function () {
  const wh = new Wormhole("Testnet", [EvmPlatform, SolanaPlatform]);

  // The original token we want to find the wrapped version of 
  const originalToken: TokenId = {
    chain: "Ethereum",
    address: wh.parseAddress(
      "Ethereum",
      "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"
    ),
  };

  // Fire 'em off async
  const resultPromises = chains.map(async (chain) => {
    const tb = await wh.getChain(chain).getTokenBridge();
    try {
      // If it doesn't exist, this will throw. The `hasWrappedAsset` will _not_ throw but
      // will only return a boolean 
      const wrapped = await tb.getWrappedAsset(originalToken);
      return { chain, wrapped: wrapped.toUniversalAddress().toString() };
    } catch (e) { }
    return { chain, wrapped: null };
  });

  const results = await Promise.all(resultPromises);
  console.log(results);
})();
