import { TokenId, Wormhole, chains } from "@wormhole-foundation/connect-sdk";
import { EvmPlatform } from "@wormhole-foundation/connect-sdk-evm";
import { SolanaPlatform } from "@wormhole-foundation/connect-sdk-solana";

(async function () {
  const wh = new Wormhole("Mainnet", [EvmPlatform, SolanaPlatform]);

  const chain = "Solana";
  const currentToken = wh.parseAddress(
    chain,
    "7VQo3HFLNH5QqGtM8eC3XQbPkJUu7nS9LeGWjerRh5Sw"
  );
  const olderToken = wh.parseAddress(
    chain,
    "BybpSTBoZHsmKnfxYG47GDhVPKrnEKX31CScShbrzUhX"
  );

  const c = wh.getChain(chain);
  const tb = await c.getTokenBridge();

  try {
    const origCurrentToken = await tb.getOriginalAsset(currentToken);
    console.log("Current Token: ", origCurrentToken);
  } catch (e) {
    console.error("failed to get original token for current token: ", e);
  }

  try {
    const origOlderToken = await tb.getOriginalAsset(olderToken);
    console.log("Older Token: ", origOlderToken);
  } catch (e) {
    console.error("failed to get original token for older token: ", e);
  }
})();
