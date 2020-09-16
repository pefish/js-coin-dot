import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from "@polkadot/keyring/types";
export declare type Transfer = {
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
export default class Wallet {
    private baseUrl;
    api: ApiPromise;
    init(): Promise<void>;
    getLatestHeight(): Promise<number>;
    listTrannsfers(): Promise<Transfer[]>;
    getTxByHash(hash: string): Promise<Transfer>;
    deriveAllBySeedPath(seed: string, path: string): Promise<{
        account: KeyringPair;
        publicKey: string;
        address: string;
    }>;
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
    verifyAddress(address: string): boolean;
}
