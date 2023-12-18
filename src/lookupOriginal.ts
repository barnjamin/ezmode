import { Wormhole, nativeChainAddress } from "@wormhole-foundation/connect-sdk";
import { EvmPlatform } from "@wormhole-foundation/connect-sdk-evm";
import { SolanaPlatform } from "@wormhole-foundation/connect-sdk-solana";

import "@wormhole-foundation/connect-sdk-solana-tokenbridge";
import "@wormhole-foundation/connect-sdk-evm-tokenbridge";

// For a given _wrapped_ token for a specific chain, look up the original token
(async function () {
  const wh = new Wormhole("Testnet", [EvmPlatform, SolanaPlatform]);

  const chain = "Ethereum";
  const token = Wormhole.parseAddress(
    chain,
    "0x494701CE895389d917a938f0ea202D4eB9684Eab"
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
