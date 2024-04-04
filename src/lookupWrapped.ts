import {
  Chain,
  TokenId,
  UniversalAddress,
  Wormhole,
  chains,
  wormhole,
} from "@wormhole-foundation/sdk";
import evm from "@wormhole-foundation/sdk/evm";
import solana from "@wormhole-foundation/sdk/solana";
import cosmwasm from "@wormhole-foundation/sdk/cosmwasm";
import sui from "@wormhole-foundation/sdk/sui";

// Lookup the Wrapped version of the original token on any chain's Token Bridge
(async function () {
  const wh = await wormhole("Mainnet", [evm, solana, cosmwasm, sui]);

  // The original token we want to find the wrapped version of
  const originalToken = {
    chain: "Near",
    address: new UniversalAddress("token.sweat", "sha256"),
  };

  // Fire 'em off async
  const resultPromises = chains.map(async (chain) => {
    try {
      const tb = await wh.getChain(chain).getTokenBridge();
      // If it doesn't exist, this will throw. The `hasWrappedAsset` will _not_ throw but
      // will only return a boolean
      // @ts-ignore
      const wrapped = await tb.getWrappedAsset(originalToken);
      return { chain, wrapped: wrapped.toString() };
    } catch (e) {}
    return { chain, wrapped: null };
  });

  const results = await Promise.all(resultPromises);
  console.log(results);
  const [t] = results;
})();
