import HttpRequestUtil from "@pefish/js-util-httprequest"
import { ApiPromise, WsProvider } from '@polkadot/api'
import Keyring, { decodeAddress, encodeAddress } from '@polkadot/keyring'
import { waitReady } from '@polkadot/wasm-crypto'
import u8aToHex from '@polkadot/util/u8a/toHex'
import { KeyringPair } from "@polkadot/keyring/types"
import { u8aSorted } from "@polkadot/util";
import { blake2AsU8a, schnorrkelKeypairFromSeed } from "@polkadot/util-crypto";
import * as bip39Lib from 'bip39'

export type TransferTxType = {
  "from": string,
  "to": string,
  "extrinsic_index": string,
  "success": boolean,
  "hash": string,
  "block_num": number,
  "block_timestamp": number,
  "module": string,
  "amount": string,
  "fee": string
}

export enum Ss58FormatEnum {
  Polkadot = 0, 
  Kusama = 2, // Polkadot Canary
  Generic_Substrate = 42,
}

export default class Wallet {

  private baseUrl: string = "https://polkadot.subscan.io"
  public api: ApiPromise

  async init(): Promise<void> {
    const readyResult = await waitReady()
    if (!readyResult) {
      throw new Error("ready error")
    }
    const provider = new WsProvider('wss://rpc.polkadot.io');
    this.api = await ApiPromise.create({ provider });
  }

  async getLatestHeight(): Promise<number> {
    const result = await this.api.rpc.chain.getHeader()
    return result["number"].toNumber()
  }

  async listTrannsfers(): Promise<TransferTxType[]> {
    const result = await HttpRequestUtil.post(`${this.baseUrl}/api/scan/transfers`, {
      params: {
        "page": 0,
        "row": 20,
      }
    })
    if (result.code !== 0) {
      throw new Error(result.message)
    }
    return result.data.transfers
  }

  async getTxByHash(hash: string): Promise<TransferTxType> {
    const result = await HttpRequestUtil.post(`${this.baseUrl}/api/scan/extrinsic`, {
      params: {
        "hash": hash,
      }
    })
    if (result.code !== 0) {
      throw new Error(result.message)
    }
    result.data.transfer.block_num = result.data.block_num
    result.data.transfer.block_timestamp = result.data.block_timestamp
    result.data.transfer.fee = result.data.fee
    result.data.transfer.extrinsic_index = result.data.extrinsic_index
    return result.data.transfer
  }

  // 波卡中每笔多签交易都需要发起方冻结一小部分DOT，直到多签交易执行了就会自动解冻。因为多签交易占用链上空间，防止大量垃圾多签交易
  createMultiSigAddress(addresses: string[], threshold: number = 2): string {
    const prefix = "modlpy/utilisuba";
    const payload = new Uint8Array(prefix.length + 1 + 32 * addresses.length + 2);
    payload.set(
      Array.from(prefix).map((c) => c.charCodeAt(0)),
      0
    );
    payload[prefix.length] = addresses.length << 2;
    const pubkeys = addresses.map((addr) => decodeAddress(addr));
    u8aSorted(pubkeys).forEach((pubkey, idx) => {
      payload.set(pubkey, prefix.length + 1 + idx * 32);
    });
    payload[prefix.length + 1 + 32 * addresses.length] = threshold;

    const publicKey = blake2AsU8a(payload);
    return encodeAddress(publicKey, Number(Ss58FormatEnum.Generic_Substrate));
  }

  /**
   * 根据字典生成随机助记码
   * @returns {*}
   */
  getRandomMnemonic (): string {
    return bip39Lib.generateMnemonic()
  }

  deriveAllByMnemonic(mnemonic: string): {
    account: KeyringPair,
    publicKey: string,
    address: string,
    polkadotAddress: string
  } {
    const keyring = new Keyring({
      type: "sr25519",
      ss58Format: Ss58FormatEnum.Generic_Substrate,
    });
    const keyringPair = keyring.addFromMnemonic(mnemonic)
    const publicKey = u8aToHex(keyringPair.publicKey)
    return {
      publicKey,
      address: keyringPair.address,
      polkadotAddress: encodeAddress(publicKey, Number(Ss58FormatEnum.Polkadot)),
      account: keyringPair,
    }
  }

  publicKeyToAddress (publicKey: string, ss58Format: Ss58FormatEnum): string {
    return encodeAddress(publicKey, Number(ss58Format))
  }

  deriveAllByKeyringPairPath(keyringPair: KeyringPair, path: string): {
    account: KeyringPair,
    publicKey: string,
    address: string,
    polkadotAddress: string
  } {
    const newKeyringPair = keyringPair.derive(path)
    const publicKey = u8aToHex(newKeyringPair.publicKey)
    return {
      publicKey: u8aToHex(newKeyringPair.publicKey),
      address: newKeyringPair.address,
      account: newKeyringPair,
      polkadotAddress: encodeAddress(publicKey, Number(Ss58FormatEnum.Polkadot)),
    }
  }

  async buildTransferTx(account: KeyringPair, toAddress: string, amount: string, opts: {
    isCheckBalance: boolean,
    isSend: boolean,
  } = {
      isCheckBalance: false,
      isSend: false,
    }): Promise<{
      txId: string,
      txData: string,
      txHex: string,
      sendFunc?: () => Promise<string>,
    }> {
    const accountInfo = await this.api.query.system.account(account.address);
    if (opts.isCheckBalance) {
      const tx = this.api.tx.balances.transfer(toAddress, amount)
      const feeInfo = await tx.paymentInfo(account)
      const fee = feeInfo.partialFee.toString(10)
      const balance = await this.getBalance(account.address)
      if (balance.sub_(fee).lt_(amount)) {
        throw new Error("balance is not enough")
      }
    }

    const tx = this.api.tx.balances.transfer(toAddress, amount)
    tx.sign(account, { nonce: accountInfo["nonce"] })
    if (opts.isSend) {
      await tx.send()
    }
    const result: {
      txId: string,
      txData: string,
      txHex: string,
      sendFunc?: () => Promise<string>,
    } = {
      txId: tx.hash.toHex(),
      txData: tx.toString(),
      txHex: tx.toHex()
    }
    if (!opts.isSend) {
      result.sendFunc = async (): Promise<string> => {
        return (await tx.send()).toHex()
      }
    }
    return result
  }

  async getBalance(address: string): Promise<string> {
    const accountInfo = await this.api.query.system.account(address);
    return accountInfo["data"].free.toString()
  }

  verifyAddress(address: string): boolean {
    try {
      decodeAddress(address)
      return true
    } catch (err) {
      return false
    }
  }

}
