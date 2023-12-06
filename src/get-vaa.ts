import {
  UniversalAddress,
  WormholeMessageId,
  api,
} from "@wormhole-foundation/connect-sdk";

import "@wormhole-foundation/connect-sdk-evm-tokenbridge";
import "@wormhole-foundation/connect-sdk-solana-tokenbridge";

(async function () {
  const mainnet_whm: WormholeMessageId = {
    chain: "Ethereum",
    emitter: new UniversalAddress(
      "0000000000000000000000003ee18b2214aff97000d974cf647e7c347e8fa585"
    ),
    sequence: 128094n,
  };
  const mainnet_apis = [
    "https://api.wormholescan.io",
    "https://wormhole-v2-mainnet-api.certus.one",
    "https://wormhole.inotel.ro",
    "https://wormhole-v2-mainnet-api.mcf.rocks",
    "https://wormhole-v2-mainnet-api.chainlayer.network",
    "https://wormhole-v2-mainnet-api.staking.fund",
    "https://wormhole-v2-mainnet.01node.com",
  ];
  for (const url of mainnet_apis) {
    console.log(url);
    try {
      const vaa = await api.getVaa(url, mainnet_whm, "Uint8Array");
      console.log(url, "worked");
    } catch (e) {
      console.log(url, "failed", (e as Error).message);
    }
  }

  const testnet_whm: WormholeMessageId = {
    chain: "Solana",
    emitter: new UniversalAddress(
      "93be388f9bc939484039dfaae34d82279f4b81d1e424b9332b7c226c5fe3debd"
    ),
    sequence: 223n,
  };

  const testnet_apis = [
    "https://api.testnet.wormholescan.io",
    "https://wormhole-v2-testnet-api.certus.one",
  ];

  for (const url of testnet_apis) {
    console.log(url);
    try {
      const vaa = await api.getVaa(url, testnet_whm, "Uint8Array");
      console.log(url, "worked");
    } catch (e) {
      console.log(url, "failed", (e as Error).message);
    }
  }
})();
