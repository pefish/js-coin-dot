import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from "@polkadot/keyring/types";
export declare type TransferTxType = {
    "from": string;
    "to": string;
    "extrinsic_index": string;
    "success": boolean;
    "hash": string;
    "block_num": number;
    "block_timestamp": number;
    "module": string;
    "amount": string;
    "fee": string;
};
export default class Remote {
    api: ApiPromise;
    private baseUrl;
    init(wssUrl?: string): Promise<void>;
    close(): Promise<void>;
    getLatestHeight(): Promise<number>;
    listTrannsfers(): Promise<TransferTxType[]>;
    getTxByHash(hash: string): Promise<TransferTxType>;
    buildTransferTx(account: KeyringPair, toAddress: string, amount: string, opts?: {
        isCheckBalance: boolean;
        isSend: boolean;
    }): Promise<{
        txId: string;
        txData: string;
        txHex: string;
        sendFunc?: () => Promise<string>;
    }>;
    getBalance(address: string): Promise<string>;
}
