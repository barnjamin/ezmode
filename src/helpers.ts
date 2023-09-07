import {
  Signer,
  ChainContext,
  ChainAddress,
  SignedTx,
  UnsignedTransaction,
  nativeChainAddress,
  TransferState,
  WormholeTransfer,
  ChainName,
  PlatformName,
} from "@wormhole-foundation/connect-sdk";

import bs58 from "bs58";
import { ethers } from "ethers";
import { Keypair } from "@solana/web3.js";

// read in from `.env`
require("dotenv").config();

// TODO: err msg instructing dev to `cp .env.template .env` and set values

export type TransferStuff = {
  chain: ChainContext<PlatformName>;
  signer: Signer;
  address: ChainAddress;
};

export async function getStuff(
  chain: ChainContext<PlatformName>
): Promise<TransferStuff> {
  let signer: Signer;
  switch (chain.platform.platform) {
    case "Solana":
      signer = getSolSigner(chain.chain);
      break;
    default:
      signer = await getEvmSigner(
        chain.chain,
        chain.getRpc() as ethers.Provider
      );
  }

  return { chain, signer, address: nativeChainAddress(signer) };
}

export async function waitLog(xfer: WormholeTransfer): Promise<void> {
  console.log("Checking for complete status");
  while ((await xfer.getTransferState()) < TransferState.Completed) {
    console.log("Not yet...");
    await new Promise((f) => setTimeout(f, 5000));
  }
}

export async function getEvmSigner(
  chain: ChainName,
  provider: ethers.Provider
): Promise<EthSigner> {
  const pk = process.env.ETH_PRIVATE_KEY!;
  const wallet = new ethers.Wallet(pk);

  const txCount = await provider.getTransactionCount(wallet.address);

  return new EthSigner(chain, wallet, txCount, provider);
}

export function getSolSigner(chain: ChainName): SolSigner {
  const pk = process.env.SOL_PRIVATE_KEY!;
  return new SolSigner(chain, Keypair.fromSecretKey(bs58.decode(pk)));
}

class SolSigner implements Signer {
  constructor(private _chain: ChainName, private _keypair: Keypair) {}

  chain(): ChainName {
    return this._chain;
  }

  address(): string {
    return this._keypair.publicKey.toBase58();
  }

  async sign(tx: UnsignedTransaction[]): Promise<any[]> {
    const signed = [];
    for (const txn of tx) {
      const { description, transaction } = txn;

      // const t = transaction as Transaction;
      // console.log(t.instructions);
      // for (const ix of t.instructions) {
      //   console.log("Program: ", ix.programId.toBase58());
      //   console.log(ix.data);
      //   ix.keys.forEach((k) => {
      //     console.log("Key: ", k.pubkey.toBase58());
      //   });
      // }

      console.log(`Signing: ${description} for ${this.address()}`);

      transaction.partialSign(this._keypair);
      signed.push(transaction.serialize());
    }
    return signed;
  }
}

class EthSigner implements Signer {
  constructor(
    private _chain: ChainName,
    private _wallet: ethers.Wallet,
    private nonce: number,
    private provider: ethers.Provider
  ) {}
  chain(): ChainName {
    return this._chain;
  }
  address(): string {
    return this._wallet.address;
  }
  async sign(tx: UnsignedTransaction[]): Promise<SignedTx[]> {
    const signed = [];
    let gasPrice = 40_000_000n;
    let maxFeePerGas = 40_000_000_000n;

    if (this._chain !== "Celo") {
      const feeData = await this.provider.getFeeData();
      gasPrice = feeData.gasPrice ?? gasPrice;
      maxFeePerGas = feeData.maxFeePerGas ?? maxFeePerGas;
    }


    for (const txn of tx) {
      const { transaction, description } = txn;
      console.log(`Signing: ${description} for ${this.address()}`);

      const t: ethers.TransactionRequest = {
        ...transaction,
        ...{
          gasLimit: 10_000_000n,
          gasPrice: gasPrice,
          maxFeePerGas: maxFeePerGas,
          nonce: this.nonce,
        },
      };
      signed.push(await this._wallet.signTransaction(t));

      this.nonce += 1;
    }
    return signed;
  }
}

export function fmtForDisplay(
  value: bigint,
  actual_decimals: bigint,
  display_decimals: number
): number {
  const fixedPlace =
    value / 10n ** (actual_decimals - BigInt(display_decimals));
  return Number(fixedPlace) / 10 ** display_decimals;
}
