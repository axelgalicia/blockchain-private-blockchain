/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
const storage = new (require('./levelSandbox')).Storage('./privatechain');

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block {
  constructor(data) {
    this.hash = "",
      this.height = 0,
      this.body = data,
      this.time = 0,
      this.previousBlockHash = ""
  }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {
  constructor(param) {
    if (typeof param === 'undefined') {
      throw new Error('Cannot create Blockchain with constructor');
    }
  }

  // Call it to initialize the Blockchain object
  static async initBlockchain() {
    const length = await storage.length();
    if (length === -1) {
      const genesisBlock = Blockchain.getBlockAsString(Blockchain.createGenesisBlock());
      const newGenesisBlock = storage.addLevelDBData(0, genesisBlock);
      if (newGenesisBlock) {
        console.log('Genesis Block created')
      }
    }
    console.log('Blockchain initialized!')
    return new Blockchain('Initialized');
  }


  //Returns a new Block which will be used as Genesis block
  static createGenesisBlock() {
    const genesisBlock = new Block('First block in the chain');
    genesisBlock.height = 0;
    genesisBlock.time = Blockchain.getTimeUTC();
    genesisBlock.hash = Blockchain.generateHash(genesisBlock);
    return genesisBlock;
  }

  // Returns the SHA256 of the block passed
  static generateHash(block) {
    return SHA256(JSON.stringify(block)).toString();
  }

  // Returns the current timestamp in the UTC format
  static getTimeUTC() {
    return new Date().getTime().toString().slice(0, -3);
  }


  // Add new block
  async addBlock(newBlock) {

    let currentHeight = await this.getBlockHeight();
    // Verify genesis block exists
    if (currentHeight === -1) {
      console.log('ADDING GENESIS FROM ADDBLOCK');
      const genesisBlock = await storage.addLevelDBData(0, Blockchain.getBlockAsString(Blockchain.createGenesisBlock()));
    }
    currentHeight = await this.getBlockHeight() + 1;
    // Block height
    newBlock.height = currentHeight;
    // UTC timestamp
    newBlock.time = Blockchain.getTimeUTC();
    // previous block hash
    let previousBlock = await storage.getLevelDBData(currentHeight - 1);
    // Assign previous block hash
    newBlock.previousBlockHash = Blockchain.getBlockFromString(previousBlock).hash;
    // Block hash with SHA256 using newBlock and converting to a string
    newBlock.hash = Blockchain.generateHash(newBlock);
    // Adding block object to chain
    const newGeneratedBlock = storage.addLevelDBData(currentHeight, Blockchain.getBlockAsString(newBlock));
    return newGeneratedBlock;
  }


  // Converts the block object to string
  static getBlockAsString(block) {
    return JSON.stringify(block);
  }
  // Converts the block string to object
  static getBlockFromString(block) {
    return JSON.parse(block);
  }

  // Get block height
  async getBlockHeight() {
    const length = await storage.length();
    return length;
  }

  // get block
  getBlock(blockHeight) {
    return storage.getLevelDBData(blockHeight);
  }


  // Validates block integrity
  validateBlockIntegrity(block) {
    // get block hash
    let blockHash = block.hash;
    // remove block hash to test block integrity
    block.hash = '';
    // generate block hash
    let validBlockHash = SHA256(JSON.stringify(block)).toString();
    block.hash = blockHash;
    // Compare
    if (blockHash === validBlockHash) {
      return true;
    } else {
      return false;
    }
  }
  // Validate hash link
  validateBlockHashLink(block, nextBlock) {
    const validLink = block.hash === nextBlock.previousBlockHash;
    if(validLink) {
      console.log(`${block.hash.slice(0,10)} <--Hash---[${block.height}]--✓--[${nextBlock.height}]--Previous hash---> ${nextBlock.previousBlockHash.slice(0,10)}`);
    } else {
      console.log(`${block.hash.slice(0,10)} <--Hash---[${block.height}]--X--[${nextBlock.height}]--Previous hash---> ${nextBlock.previousBlockHash.slice(0,10)}`);
    }
    
    return validLink;
  }

  // Validates all the chain
  validateChain() {
    return this.getBlockHeight()
      .then(async (height) => {
        let errors = [];
        for (let z = 0; z < height + 1; z++) {
          let blockToValidate = Blockchain.getBlockFromString(await this.getBlock(z));
          const blockValidation = await this.validateBlockIntegrity(blockToValidate);
          let hashLinkValidation = true;
          if (z < height) {
            if(z === 4) console.log(blockToValidate);
            let nextBlock = Blockchain.getBlockFromString(await this.getBlock(z + 1));
            hashLinkValidation = this.validateBlockHashLink(blockToValidate, nextBlock);
          }
          const valid = (blockValidation === true && hashLinkValidation === true);
          if (!valid && !errors.includes(z)) {
            const errorBlock = blockValidation === true && hashLinkValidation === false ? z + 1: z;
            errors.push(errorBlock);
          }
        }
        return errors;
      })
  }

}




// Testing Blockchain scenarios
function runTest() {
  Blockchain.initBlockchain().then(async (bc) => {

    // Current Height
    let currentBlockHeigh = await bc.getBlockHeight();


    console.log('--------------------------------------')
    console.log(`Current height: ${currentBlockHeigh}`);
    console.log('--------------------------------------')
    // Adding 4 blocks
    const block1 = await bc.addBlock(new Block(`Block #${++currentBlockHeigh}`));
    const block2 = await bc.addBlock(new Block(`Block #${++currentBlockHeigh}`));
    const block3 = await bc.addBlock(new Block(`Block #${++currentBlockHeigh}`));
    const block4 = await bc.addBlock(new Block(`Block #${++currentBlockHeigh}`));
    const blocks = [block1, block2, block3, block4];
    console.log(`4 Blocks added:`);
    console.log(blocks)
    console.log('--------------------------------------')



    // Validate block 3 integrity
    const validation = await bc.validateBlockIntegrity(JSON.parse(block3));
    console.log(`Is block #3 valid: ${true === validation}`);
    console.log('--------------------------------------')



    // Validate chain before errors
    let chainErrors = await bc.validateChain();
    chainErrors = chainErrors.filter(p => p !== true);
    console.log(`Errors found in chain: ${chainErrors.length}`);
    console.log(chainErrors);
    console.log('--------------------------------------')

    // Tampering data in the chain
    let block4Copy = Blockchain.getBlockFromString(await bc.getBlock(4));
    block4Copy.previousBlockHash = 'SOME FAKE HASH';
    await storage.addLevelDBData(4, Blockchain.getBlockAsString(block4Copy));

    console.log('-----------------AFTER TAMPERING Block 4---------------')
    // Validate chain after error introduced
    chainErrors = await bc.validateChain();
    chainErrors = chainErrors.filter(p => p !== true);
    console.log(`Errors found in chain: ${chainErrors.length}`);
    console.log(chainErrors);
    console.log('------------------------------------------------------');

  }).catch(e => {
    console.log(e);
  });

}

runTest();