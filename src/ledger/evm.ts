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
    for (const tx of txs) {
      const t: TransactionRequest = {
        ...tx.transaction,
        from: this.address(),
        nonce: await this._signer.getNonce(),
      };
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
