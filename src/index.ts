import { ChainName, Wormhole } from "@wormhole-foundation/connect-sdk";
import { EvmPlatform } from "@wormhole-foundation/connect-sdk-evm";
import { SolanaPlatform } from "@wormhole-foundation/connect-sdk-solana";
import { fmtForDisplay, getStuff } from "./helpers";

(async function () {
  const wh = new Wormhole("Testnet", [EvmPlatform, SolanaPlatform]);

  // Native is the gas token for any chain (e.g. Eth for Ethereum, Sol for Solana, etc..)
  const token = "native";

  // Get some signers
  const { signer: fromSigner, address: fromAddress } = await getStuff(
    wh.getChain("Avalanche")
  );
  const { signer: toSigner, address: toAddress } = await getStuff(
    wh.getChain("Solana")
  );

  // Grab some balances
  const chains: ChainName[] = ["Ethereum", "Avalanche", "Celo"];
  for (const chain of chains) {
    const balance = await wh.getBalance(chain, token, fromSigner.address());
    const decimals = await wh.getDecimals(chain, token);
    console.log(`Balance on ${chain}: ${fmtForDisplay(balance!, decimals, 8)}`);
  }

  // Make (manual) a token transfer
  const xfer = await wh.tokenTransfer(
    token,
    1_000_000_000_000n,
    fromAddress,
    toAddress,
    false
  );
  console.log(xfer);

  const srcTxIds = await xfer.initiateTransfer(fromSigner);
  console.log("Initiated transfer with txids: ", srcTxIds);

  const attestation = await xfer.fetchAttestation();
  console.log("Got attestation: ", attestation);

  const dstTxIds = await xfer.completeTransfer(toSigner);
  console.log("Completed transfer with txids: ", dstTxIds);
})();
