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
export declare enum Ss58FormatEnum {
    Polkadot = 0,
    Kusama = 2,
    Generic_Substrate = 42
}
export default class Wallet {
    private baseUrl;
    api: ApiPromise;
    init(): Promise<void>;
    getLatestHeight(): Promise<number>;
    listTrannsfers(): Promise<TransferTxType[]>;
    getTxByHash(hash: string): Promise<TransferTxType>;
    createMultiSigAddress(addresses: string[], threshold?: number): string;
    /**
     * 根据字典生成随机助记码
     * @returns {*}
     */
    getRandomMnemonic(): string;
    deriveAllByMnemonic(mnemonic: string): {
        account: KeyringPair;
        publicKey: string;
        address: string;
        polkadotAddress: string;
    };
    publicKeyToAddress(publicKey: string, ss58Format: Ss58FormatEnum): string;
    deriveAllByKeyringPairPath(keyringPair: KeyringPair, path: string): {
        account: KeyringPair;
        publicKey: string;
        address: string;
        polkadotAddress: string;
    };
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
