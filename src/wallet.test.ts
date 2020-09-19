import "@pefish/js-node-assist"
import assert from 'assert'
import Wallet from "./wallet"

describe('Wallet', () => {
  let wallet: Wallet

  before(async () => {
    wallet = new Wallet()
    await wallet.init()
    await wallet.initRemote()
  })

  it('deriveAllByMnemonic', async () => {
    try {
      const result = wallet.deriveAllByMnemonic("mandate hat defy case picnic term sea pave rate action aware alien")
      // console.log(result)
      assert.strictEqual(result.address, "5Dh7uFDr2sZ4fPJPoRYdpwGTdS38HQsw81PMdKAbESymKynz")
      assert.strictEqual(result.polkadotAddress, "12dR3aUutepY6vJum4bdy66cV42myiS5CW7qnc9wnY1HWBwM")
    } catch (err) {
      console.error(err)
      assert.throws(() => { }, err)
    }
  })

  it('deriveAllByKeyringPairPath', async () => {
    try {
      const result = wallet.deriveAllByMnemonic("mandate hat defy case picnic term sea pave rate action aware alien")
      const result1 = wallet.deriveAllByKeyringPairPath(result.account, "//0")
      // console.log(result)
      assert.strictEqual(result1.publicKey, "0x5218bee68c4c79ddaac192625cce9286add4ce9d29719f920c698873ba0f6b07")
      assert.strictEqual(result1.address, "5DvM8mSPXcUL8T1ck17XFP67BK1tJ4TtnbE8UpVCYdfyY1dC")
      assert.strictEqual(result1.polkadotAddress, "12reH6hTPPjoZz28heAXPXvG2w1XzN22s5xce7UZ6ihViXnn")
    } catch (err) {
      console.error(err)
      assert.throws(() => { }, err)
    }
  })

  it('publicKeyToAddress', async () => {
    try {
      const result = wallet.publicKeyToAddress("0x5218bee68c4c79ddaac192625cce9286add4ce9d29719f920c698873ba0f6b07", 0)
      // console.log(result)
      assert.strictEqual(result, "12reH6hTPPjoZz28heAXPXvG2w1XzN22s5xce7UZ6ihViXnn")
    } catch (err) {
      console.error(err)
      assert.throws(() => { }, err)
    }
  })

  it('createMultiSigAddress', async () => {
    try {
      const result = await wallet.createMultiSigAddress([
        "15o5762QE4UPrUaYcM83HERK7Wzbmgcsxa93NJjkHGH1unvr",
        "1TMxLj56NtRg3scE7rRo8H9GZJMFXdsJk1GyxCuTRAxTTzU"
      ], 1)
      // console.log(result)
      assert.strictEqual(result, "5GK2KzG8Eyg76RHVvtKyocRpCwYSZVf78HjZW4cN3Ac8fcVe")
    } catch (err) {
      console.error(err)
      assert.throws(() => { }, err)
    }
  })

  it('getLatestHeight', async () => {
    try {
      const result = await wallet.remote.getLatestHeight()
      // console.log(result)
      assert.strictEqual(result > 0, true)
    } catch (err) {
      console.error(err)
      assert.throws(() => { }, err)
    }
  })

  it('buildTransferTx', async () => {
    try {
      const addressInfo = await wallet.deriveAllByMnemonic("test")
      const result = await wallet.remote.buildTransferTx(
        addressInfo.account,
        "15PPkbBrUMoVfqzGTZyQNnCf6ekbrS5C1d62p4M9GR7oHrda",
        "100000000000"
      )
      // console.log(result)
      assert.strictEqual(result.txId.length, 66)
    } catch (err) {
      console.error(err)
      assert.throws(() => { }, err)
    }
  })

  it('getBalance', async () => {
    try {
      const result = await wallet.remote.getBalance("15PPkbBrUMoVfqzGTZyQNnCf6ekbrS5C1d62p4M9GR7oHrda")
      // console.log(result)
      assert.strictEqual(result, "0")
    } catch (err) {
      console.error(err)
      assert.throws(() => { }, err)
    }
  })

  it('verifyAddress', async () => {
    try {
      const result = wallet.verifyAddress("15PPkbBrUMoVfqzGTZyQNnCf6ekbrS5C1d62p4M9GR7oHrda")
      // console.log(result)
      assert.strictEqual(result, true)

      const result1 = wallet.verifyAddress("15PPkbBrUMoVfqzGTZyQNnCf6ekbrS5C1d62p4M9GR7oHrda11")
      // console.log(result)
      assert.strictEqual(result1, false)
    } catch (err) {
      console.error(err)
      assert.throws(() => { }, err)
    }
  })
})