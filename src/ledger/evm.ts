import {
  Chain,
  Network,
  SignOnlySigner,
  UnsignedTransaction,
} from "@wormhole-foundation/sdk";
import { TransactionRequest, Provider } from "ethers";
import { LedgerSigner } from "@xlabs-xyz/ledger-signer-ethers-v6";

export class EvmLedgerSinger<N extends Network, C extends Chain>
  implements SignOnlySigner<N, C>
{
  constructor(
    private _signer: LedgerSigner,
    private _address: string,
    private _chain: C
  ) {}

  static async fromPath<C extends Chain>(
    chain: C,
    provider: Provider,
    path?: string
  ): Promise<EvmLedgerSinger<Network, C>> {
    // @ts-ignore
    const signer = await LedgerSigner.create(provider, path);
    const address = await signer.getAddress();
    return new EvmLedgerSinger(signer, address, chain);
  }

  async sign(txs: UnsignedTransaction<N, C>[]): Promise<any[]> {
    const signed = [];

    // Default gas values
    let gasLimit = 500_000n;
    let gasPrice = 100_000_000_000n; // 100gwei
    let maxFeePerGas = 1_500_000_000n; // 1.5gwei
    let maxPriorityFeePerGas = 100_000_000n; // 0.1gwei

    // If no overrides were passed, we can get better
    // gas values from the provider
    // Celo does not support this call
    if (this._chain !== "Celo") {
      const feeData = await this._signer.provider!.getFeeData();
      console.log(feeData);
      gasPrice = feeData.gasPrice ?? gasPrice;
      maxFeePerGas = feeData.maxFeePerGas ?? maxFeePerGas;
      maxPriorityFeePerGas =
        feeData.maxPriorityFeePerGas ?? maxPriorityFeePerGas;
    }

    // Oasis throws malformed errors unless we
    // set it to use legacy transaction parameters
    const gasOpts =
      this._chain === "Oasis"
        ? { gasLimit, gasPrice, type: 0 } // Hardcoded to legacy transaction type
        : { gasLimit, maxFeePerGas, maxPriorityFeePerGas };

    for (const tx of txs) {
      const t: TransactionRequest = {
        ...tx.transaction,
        nonce: await this._signer.getNonce(),
        ...gasOpts,
      };
      // Ledger pukes on this
      delete t.from;
      signed.push(await this._signer.signTransaction(t));
    }
    return signed;
  }

  chain(): C {
    return this._chain;
  }
  address(): string {
    return this._address;
  }
}
