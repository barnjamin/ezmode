import {
  Chain,
  TokenId,
  Wormhole,
  canonicalAddress,
  wormhole,
} from "@wormhole-foundation/sdk";
import { evm } from "@wormhole-foundation/sdk/evm";
import { solana } from "@wormhole-foundation/sdk/solana";

type ResolvedAsset = {
  address: string;
  original: TokenId;
  resolved?: TokenId;
};

// Lookup the Wrapped version of the original token on any chain's Token Bridge
(async function () {
  const wh = await wormhole("Testnet", [evm, solana]);

  const src: Chain = "Ethereum";
  const dst: Chain = "Solana";

  const addrs = [
    "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844",
    "0xB19693FEB013Bab65866dE0a845a9511064230cE",
    "0x7cd0e8ff09cEB653813bD3d63d0554c1CB4BFdf6",
    "0xF6699D3f725C4b64Cc6010F2DF77B4B05C76Cd5C",
    "0x4C1b727f6df3B075E682C41a25687A69846aaC04",
    "0x0d7A9Cdbb7C21E64825cF81750A5081a32aFb5d4",
    "0xe092525a787CD56B901279b5864a224c22B95B72",
    "0x494701CE895389d917a938f0ea202D4eB9684Eab",
    "0x0dc83BB61008A5E1194fe50fA9E474713C1AEcD7",
    "0x70F7360C49D227ccBbb98fB7B69B7CDB651195bb",
  ];

  const srcCtx = wh.getChain(src);
  const srcTb = await srcCtx.getTokenBridge();

  const dstCtx = wh.getChain(dst);
  const dstTb = await dstCtx.getTokenBridge();

  const resultPromises: Promise<ResolvedAsset>[] = addrs.map(async (addr) => {
    // The original token we want to find the wrapped version of
    let originalToken: TokenId = Wormhole.tokenId(src, addr);
    try {
      // @ts-ignore
      const _orig = await srcTb.getOriginalAsset(originalToken.address);
      originalToken = _orig;
    } catch {}

    if (originalToken.chain === dst)
      return {
        address: addr,
        original: originalToken,
        resolved: {
          chain: dst,
          // @ts-ignore
          address: originalToken.address.toNative(dst),
        },
      };

    try {
      const wrapped = await dstTb.getWrappedAsset(originalToken);
      return {
        address: addr,
        original: originalToken,
        resolved: { chain: dst, address: wrapped },
      };
    } catch {}

    return { address: addr, original: originalToken };
  });

  const results = await Promise.all(resultPromises);
  console.log(results);
  for (const result of results) {
    const { resolved } = result;
    if (resolved) console.log(canonicalAddress(resolved));
  }
})();
