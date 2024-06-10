import { PublicKey, Transaction } from "@solana/web3.js";
import {
  Chain,
  Network,
  SignOnlySigner,
  UnsignedTransaction,
  encoding,
} from "@wormhole-foundation/sdk";
import {
  isVersionedTransaction,
  SolanaUnsignedTransaction,
} from "@wormhole-foundation/sdk-solana";
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

    // TODO: need recent blockhash fetched from the network

    for (const tx of txs) {
      const {
        transaction: { transaction, signers },
      } = tx as SolanaUnsignedTransaction<N, "Solana">;

      const signature = await this._signer.signTransaction(
        Buffer.from(
          transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
          })
        )
      );
      transaction.addSignature(new PublicKey(this.address()), signature);

      if (signers && signers.length > 0) {
        if (isVersionedTransaction(transaction)) {
          transaction.sign(signers);
        } else {
          transaction.partialSign(...signers);
        }
      }

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
