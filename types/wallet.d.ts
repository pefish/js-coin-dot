import { KeyringPair } from "@polkadot/keyring/types";
import Remote from "./remote";
export declare enum Ss58FormatEnum {
    Polkadot = 0,
    Kusama = 2,
    Generic_Substrate = 42
}
export default class Wallet {
    remote: Remote;
    init(): Promise<void>;
    initRemote(wssUrl?: string): Promise<void>;
    createMultiSigAddress(addresses: string[], threshold?: number): string;
    /**
     * 根据字典生成随机助记码
     * @returns {*}
     */
    getRandomMnemonic(): string;
    deriveAllByMnemonicPass(mnemonic: string, pass: string): {
        account: KeyringPair;
        publicKey: string;
        address: string;
        polkadotAddress: string;
    };
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
    verifyAddress(address: string): boolean;
}
