import Keyring, { decodeAddress, encodeAddress } from '@polkadot/keyring'
import u8aToHex from '@polkadot/util/u8a/toHex'
import { KeyringPair } from "@polkadot/keyring/types"
import { u8aSorted } from "@polkadot/util";
import { blake2AsU8a } from "@polkadot/util-crypto";
import * as bip39Lib from 'bip39'
import Remote from "./remote"
import { waitReady, isReady } from '@polkadot/wasm-crypto'

export enum Ss58FormatEnum {
  Polkadot = 0, 
  Kusama = 2, // Polkadot Canary
  Generic_Substrate = 42,
}

export default class Wallet {
  public remote: Remote

  async init () {
    if (!isReady()) {
      const readyResult = await waitReady()
      if (!readyResult) {
        throw new Error("ready error")
      }
    }
  }

  async initRemote(wssUrl?: string): Promise<void> {
    this.remote = new Remote()
    await this.remote.init(wssUrl)
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

  deriveAllByMnemonicPass(mnemonic: string, pass: string): {
    account: KeyringPair,
    publicKey: string,
    address: string,
    polkadotAddress: string
  } {
    return this.deriveAllByMnemonic(`${mnemonic}${pass}`)
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
    if (!publicKey.startsWith("0x")) {
      publicKey = "0x" + publicKey
    }
    return encodeAddress(publicKey, Number(ss58Format))
  }

  addressToPublicKey (address: string): string {
    return u8aToHex(decodeAddress(address))
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

  verifyAddress(address: string): boolean {
    try {
      decodeAddress(address)
      return true
    } catch (err) {
      return false
    }
  }

}
