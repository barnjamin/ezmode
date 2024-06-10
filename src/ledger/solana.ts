import {
  Chain,
  Network,
  SignOnlySigner,
  UnsignedTransaction,
  encoding,
} from "@wormhole-foundation/sdk";
import { SolanaUnsignedTransaction } from "@wormhole-foundation/sdk-solana";
import { SolanaLedgerSigner as LedgerSigner } from "@xlabs-xyz/ledger-signer-solana";

export class SolanaLedgerSigner<N extends Network, C extends Chain>
  implements SignOnlySigner<N, C>
{
  constructor(
    private _signer: LedgerSigner,
    private _address: string,
    private _chain: C
  ) {}

  static async fromPath(
    path: string
  ): Promise<SolanaLedgerSigner<Network, Chain>> {
    const signer = await LedgerSigner.create(path);
    const address = encoding.b58.encode(await signer.getAddress());
    return new SolanaLedgerSigner(signer, address, "Solana");
  }

  async sign(txs: UnsignedTransaction<N, C>[]): Promise<any[]> {
    const signed = [];
    for (const tx of txs) {
      const { transaction } = tx as SolanaUnsignedTransaction<N, "Solana">;
      signed.push(
        await this._signer.signTransaction(
          Buffer.from(transaction.transaction.serialize())
        )
      );

      if (transaction.signers && transaction.signers.length > 0) {
        // TODO: other signers?
        throw "Unhandled";
      }
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
