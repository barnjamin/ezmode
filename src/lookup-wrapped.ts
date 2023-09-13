import { TokenId, Wormhole, chains } from "@wormhole-foundation/connect-sdk";
import { EvmPlatform } from "@wormhole-foundation/connect-sdk-evm";
import { SolanaPlatform } from "@wormhole-foundation/connect-sdk-solana";

(async function () {
  const wh = new Wormhole("Testnet", [EvmPlatform, SolanaPlatform]);

  const token: TokenId = {
    chain: "Ethereum",
    address: wh.parseAddress(
      "Ethereum",
      "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"
    ),
  };

  const resultPromises = chains.map(async (chain) => {
    try {
      const c = wh.getChain(chain);
      const tb = await c.getTokenBridge();
      const wrapped = await tb.getWrappedAsset(token);
      return { chain, wrapped: wrapped.toUniversalAddress().toString() };
    } catch (e) {}
    return { chain, wrapped: null };
  });

  const results = await Promise.all(resultPromises);
  console.log(results);
})();
