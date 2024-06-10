import {
  Chain,
  Network,
  SignOnlySigner,
  UnsignedTransaction,
} from "@wormhole-foundation/sdk";
import { TransactionRequest } from "ethers";
import { LedgerSigner } from "@xlabs-xyz/ledger-signer-ethers-v6";

export class EvmLedgerSinger<N extends Network, C extends Chain>
  implements SignOnlySigner<N, C>
{
  constructor(
    private _signer: LedgerSigner,
    private _address: string,
    private _chain: C
  ) {}

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
