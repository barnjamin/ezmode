import { Wormhole, canonicalAddress, wormhole } from "@wormhole-foundation/sdk";
import evm from "@wormhole-foundation/sdk/evm";
import solana from "@wormhole-foundation/sdk/solana";

// For a given _wrapped_ token for a specific chain, look up the original token
(async function () {
  const wh = await wormhole("Mainnet", [evm, solana]);

  const chain = "Solana";
  const token = Wormhole.parseAddress(
    chain,
    "7hdeo5QciUF8S2vfsx6uRJkdNVADBU3DDcXW4zjDcMin"
  );

  const tb = await wh.getChain(chain).getTokenBridge();
  try {
    const origToken = await tb.getOriginalAsset(token);
    const nativeAddress = canonicalAddress(origToken);
    console.log(`Original Token: ${origToken.chain} / ${nativeAddress}`);
  } catch (e) {
    console.error("failed to get original token: ", e);
  }
})();
