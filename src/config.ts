import { Wormhole } from "@wormhole-foundation/connect-sdk";
import { EvmPlatform } from "@wormhole-foundation/connect-sdk-evm";

(async function () {
  // Pass a partial WormholeConfig object to override specific
  // fields in the default config
  const wh = new Wormhole("Testnet", [EvmPlatform], {
    chains: {
      Ethereum: {
        // rando Goerli rpc from chain list
        rpc: "https://eth-goerli.public.blastapi.io",
      },
    },
  });

  console.log(wh.config.chains.Ethereum);

  const ethCtx = wh.getChain("Ethereum");
  console.log(await ethCtx.getLatestBlock());
})();
