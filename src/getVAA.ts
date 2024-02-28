import {
  UniversalAddress,
  Wormhole,
  WormholeMessageId,
  api,
} from "@wormhole-foundation/sdk";

(async function () {
  const whm: WormholeMessageId = {
    chain: "Ethereum",
    emitter: new UniversalAddress(
      "0000000000000000000000003ee18b2214aff97000d974cf647e7c347e8fa585"
    ),
    sequence: 128094n,
  };
  const apiUrl = "https://api.wormholescan.io";
  const vaa = await api.getVaa(apiUrl, whm, "Uint8Array");
  console.log(vaa);

  // Or use the method on the Wormhole class
  // that comes pre-configured with the api endpoints
  // and allows passing a timeout for retries
  const wh = new Wormhole("Mainnet", []);
  console.log(await wh.getVaa(whm, "Uint8Array", 60_000));
})();
