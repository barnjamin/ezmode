import { Connection, PublicKey } from "@solana/web3.js";
import {
  Chain,
  Network,
  SignOnlySigner,
  UnsignedTransaction,
  encoding,
} from "@wormhole-foundation/sdk";
import {
  SolanaUnsignedTransaction,
  isVersionedTransaction,
} from "@wormhole-foundation/sdk-solana";
import { SolanaLedgerSigner as LedgerSigner } from "@xlabs-xyz/ledger-signer-solana";

export class SolanaLedgerSigner<N extends Network, C extends Chain>
  implements SignOnlySigner<N, C>
{
  constructor(
    private _connection: Connection,
    private _signer: LedgerSigner,
    private _address: string,
    private _chain: C
  ) {}

  static async fromPath<C extends Chain>(
    chain: C,
    connection: Connection,
    path: string
  ): Promise<SolanaLedgerSigner<Network, C>> {
    const signer = await LedgerSigner.create(path);
    const address = encoding.b58.encode(await signer.getAddress());
    return new SolanaLedgerSigner(connection, signer, address, chain);
  }

  async sign(txs: UnsignedTransaction<N, C>[]): Promise<any[]> {
    const signed = [];

    const { blockhash, lastValidBlockHeight } =
      await this._connection.getLatestBlockhash();

    for (const tx of txs) {
      const {
        transaction: { transaction, signers },
      } = tx as SolanaUnsignedTransaction<N, "Solana">;

      if (isVersionedTransaction(transaction)) {
        transaction.message.recentBlockhash = blockhash;
      } else {
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
      }

      if (signers && signers.length > 0) {
        if (isVersionedTransaction(transaction)) {
          transaction.sign(signers);
        } else {
          transaction.partialSign(...signers);
        }
      }

      const serialized = isVersionedTransaction(transaction)
        ? transaction.serialize()
        : transaction.compileMessage().serialize();

      const signature = await this._signer.signTransaction(
        Buffer.from(serialized)
      );
      transaction.addSignature(new PublicKey(this.address()), signature);
      signed.push(transaction.serialize());
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
