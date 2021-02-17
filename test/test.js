const { assert } = require('chai')
const { default: Web3 } = require('web3')

const Solidagram = artifacts.require('./Solidagram.sol')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Solidagram', ([deployer, author, tipper]) => {
  let solidagram

  before(async () => {
    solidagram = await Solidagram.deployed()
  })

  describe('deployment', async () => {
    it('deploys successfully', async () => {
      const address = await solidagram.address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })

    it('has a name', async () => {
      const name = await solidagram.name()
      assert.equal(name, 'Solidagram')
    })
  })

  describe('images', async () => {
    let result, imageCount
    const hash = 'abc123'

    before(async () => {
      result = await solidagram.uploadImage(hash, 'Image description', { from: author })
      imageCount = await solidagram.imageCount()
    })

    it('creates images', async () => {
      // Success
      assert.equal(imageCount, 1)
      const event = result.logs[0].args
      assert.equal(event.id.toNumber(), imageCount.toNumber(), 'id is correct')
      assert.equal(event.hash, hash, 'hash is correct')
      assert.equal(event.description, 'Image description', 'description is correct')
      assert.equal(event.tipAmount, '0', 'tip is correct')
      assert.equal(event.author, author, 'author is correct')

      // Failure:  Image must have hash
      await solidagram.uploadImage('', 'Image description', { from: author }).should.be.rejected;

      // Failure:  Image must have description
      await solidagram.uploadImage('Image hash', '', { from: author }).should.be.rejected;
    })

      // Check from Struct
      it('lists images', async() => {
        const image = await solidagram.images(imageCount)
        assert.equal(image.id.toNumber(), imageCount.toNumber(), 'id is correct')
        assert.equal(image.hash, hash, 'hash is correct')
        assert.equal(image.description, 'Image description', 'description is correct')
        assert.equal(image.tipAmount, '0', 'tip is correct')
        assert.equal(image.author, author, 'author is correct')
      })

      it('allows users to tip images', async () => {
        // Track the author balance before purchase
        let oldAuthorBalance
        oldAuthorBalance = await web3.eth.getBalance(author)
        oldAuthorBalance = new web3.utils.BN(oldAuthorBalance)

        result = await solidagram.tipImageOwner(imageCount, { from: tipper, value: web3.utils.toWei('1', 'Ether') })

        // Success
        const event = result.logs[0].args
        assert.equal(event.id.toNumber(), imageCount.toNumber(), 'id is correct')
        assert.equal(event.hash, hash, 'hash is correct')
        assert.equal(event.description, 'Image description', 'description is correct')
        assert.equal(event.tipAmount, '1000000000000000000', 'tip is correct')
        assert.equal(event.author, author, 'author is correct')

        // Check that author received funds
        let newAuthorBalance
        newAuthorBalance = await web3.eth.getBalance(author)
        newAuthorBalance = new web3.utils.BN(newAuthorBalance)

        let tipImageOwner = web3.utils.toWei('1', 'Ether')
        tipImageOwner = new web3.utils.BN(tipImageOwner)

        const expectedBalance = oldAuthorBalance.add(tipImageOwner)

        assert.equal(newAuthorBalance.toString(), expectedBalance.toString())

        // Failure:  Tries to tip image that does not exist
        await solidagram.tipImageOwner(99, { from: tipper, value: web3.utils.toWei('1', 'ETHER')}).should.be.rejected;
      })
  })
})