import "@pefish/js-node-assist"
import assert from 'assert'
import Wallet from "./wallet"

describe('Wallet', () => {
  let wallet: Wallet

  before(async () => {
    wallet = new Wallet()
    await wallet.init()
  })

  it('deriveAllBySeedPath', async () => {
    try {
      const result = await wallet.deriveAllBySeedPath("test", "m/0/0")
      // console.log(result)
      assert.strictEqual(result.address, "15PPkbBrUMoVfqzGTZyQNnCf6ekbrS5C1d62p4M9GR7oHrda")
      assert.strictEqual(result.publicKey, "0xc204ebd56b0ecaee61754799b38a1b0b4261e9cd7ff1c2a0863096722e0b2053")
    } catch (err) {
      console.error(err)
      assert.throws(() => { }, err)
    }
  })

  it('getLatestHeight', async () => {
    try {
      const result = await wallet.getLatestHeight()
      // console.log(result)
      assert.strictEqual(result > 0, true)
    } catch (err) {
      console.error(err)
      assert.throws(() => { }, err)
    }
  })

  it('buildTransferTx', async () => {
    try {
      const addressInfo = await wallet.deriveAllBySeedPath("test", "m/0/0")
      const result = await wallet.buildTransferTx(
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
      const result = await wallet.getBalance("15PPkbBrUMoVfqzGTZyQNnCf6ekbrS5C1d62p4M9GR7oHrda")
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