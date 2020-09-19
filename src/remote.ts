import HttpRequestUtil from "@pefish/js-util-httprequest"
import { ApiPromise, WsProvider } from '@polkadot/api'
import { KeyringPair } from "@polkadot/keyring/types"
import { waitReady, isReady } from '@polkadot/wasm-crypto'

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

export default class Remote {
  public api: ApiPromise
  private baseUrl: string = "https://polkadot.subscan.io"

  async init(wssUrl: string = 'wss://rpc.polkadot.io'): Promise<void> {
    const provider = new WsProvider(wssUrl);
    this.api = await ApiPromise.create({ provider });

    if (!isReady()) {
      const readyResult = await waitReady()
      if (!readyResult) {
        throw new Error("ready error")
      }
    }
  }

  async close (): Promise<void> {
    await this.api.disconnect()
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

    const tx = this.api.tx.balances.transferKeepAlive(toAddress, amount)
    await tx.signAsync(account, { nonce: accountInfo["nonce"] })
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
}
