import { wormhole } from "@wormhole-foundation/sdk";
import evm from "@wormhole-foundation/sdk/evm";

(async function () {
  // Pass a partial WormholeConfig object to override specific
  // fields in the default config
  const wh = await wormhole("Testnet", [evm], {
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
