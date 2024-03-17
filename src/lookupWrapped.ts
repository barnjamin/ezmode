import { Chain, TokenId, Wormhole, wormhole } from "@wormhole-foundation/sdk";
import evm from "@wormhole-foundation/sdk/evm";
import solana from "@wormhole-foundation/sdk/solana";
import cosmwasm from "@wormhole-foundation/sdk/cosmwasm";
import sui from "@wormhole-foundation/sdk/sui";

// Lookup the Wrapped version of the original token on any chain's Token Bridge
(async function () {
  const wh = await wormhole("Mainnet", [evm, solana, cosmwasm, sui]);

  // The original token we want to find the wrapped version of
  const originalToken: TokenId = Wormhole.chainAddress(
    "Solana",
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
  );

  const chains = ["Sui"] as Chain[];

  // Fire 'em off async
  const resultPromises = chains.map(async (chain) => {
    const tb = await wh.getChain(chain).getTokenBridge();
    try {
      // If it doesn't exist, this will throw. The `hasWrappedAsset` will _not_ throw but
      // will only return a boolean
      const wrapped = await tb.getWrappedAsset(originalToken);
      return { chain, wrapped: wrapped.toString() };
    } catch (e) {}
    return { chain, wrapped: null };
  });

  const results = await Promise.all(resultPromises);
  console.log(results);
  const [t] = results;

  const d = await wh
    .getChain("Sui")
    .getDecimals(Wormhole.parseAddress("Sui", t!.wrapped! as string));
  console.log(d);
})();
