import { Wormhole } from "@wormhole-foundation/connect-sdk";
import { EvmPlatform } from "@wormhole-foundation/connect-sdk-evm";
import { fmtForDisplay } from "./helpers";

(async function () {
  const wh = new Wormhole("Testnet", [EvmPlatform]);

  const token = "native";
  const address = "0x6603b4a7E29DfBDB6159c395a915e74757c1FB13";

  const balance = await wh.getBalance("Ethereum", token, address);
  const decimals = await wh.getDecimals("Ethereum", token);

  console.log(fmtForDisplay(balance!, decimals, 8));
})();
