import { Wormhole, canonicalAddress } from "@wormhole-foundation/sdk";
import { evm } from "@wormhole-foundation/sdk/evm";
import { solana } from "@wormhole-foundation/sdk/solana";

// For a given _wrapped_ token for a specific chain, look up the original token
(async function () {
  const wh = new Wormhole("Testnet", [evm.Platform, solana.Platform]);

  const chain = "Ethereum";
  const token = Wormhole.parseAddress(
    chain,
    "0x494701CE895389d917a938f0ea202D4eB9684Eab"
  );

  console.log(token.unwrap().toString());

  const tb = await wh.getChain(chain).getTokenBridge();
  try {
    const origToken = await tb.getOriginalAsset(token);
    const nativeAddress = canonicalAddress(origToken);
    console.log(`Original Token: ${origToken.chain} / ${nativeAddress}`);
  } catch (e) {
    console.error("failed to get original token: ", e);
  }
})();
