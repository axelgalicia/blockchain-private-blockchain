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
    currentHeight = await this.getBlockHeight();
    // Block height
    newBlock.height = currentHeight;
    // UTC timestamp
    newBlock.time = Blockchain.getTimeUTC();
    // previous block hash
    let previousBlock = await storage.getLevelDBData(currentHeight);
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
  getBlockHeight() {
    return storage.length();
  }

  // get block
  getBlock(blockHeight) {
    return storage.getLevelDBData(blockHeight);
  }

  // validate block - Returns the block heigh if the block is not valid
  async validateBlock(blockHeight) {
    // get block object
    const blockString = await this.getBlock(blockHeight);
    const blockObject = Blockchain.getBlockFromString(blockString);
    const validIntegrity = await this.validateBlockIntegrity(blockObject);
    if (validIntegrity !== true) {
      return blockHeight;
    }
    const validHashLink = await this.validateBlockHashLink(blockObject);
    return validHashLink;
  }

  // Validates block integrity
  async validateBlockIntegrity(block) {
    // get block hash
    let blockHash = block.hash;
    // remove block hash to test block integrity
    block.hash = '';
    // generate block hash
    let validBlockHash = SHA256(JSON.stringify(block)).toString();
    // Compare
    if (blockHash === validBlockHash) {
      block.hash = blockHash;
      return true;
    } else {
      console.log('Block #' + block.height + ' invalid hash:\n' + blockHash + ' <>  ' + validBlockHash);
      return block.height;
    }
  }
  // Validate hash link
  validateBlockHashLink(block) {
    return this.getBlock(block.height + 1)
      .then(nextBlock => this.validatePreviousHash(block, nextBlock));
  }

  // Validates previous blockHash from next block
  validatePreviousHash(block, nextBlock) {
    let blockHash = block.hash;
    let nextBlockObject = Blockchain.getBlockFromString(nextBlock);
    // compare blocks hash link
    let previousHash = nextBlockObject.previousBlockHash;
    if (blockHash !== previousHash) {
      return Promise.resolve(block.height);
    }
    return Promise.resolve(true);
  }

  // Validates the block
  getValidateBlockPromise(height) {
    return this.validateBlock(height);
  }

  // Validates all the chain
  validateChain() {
    return this.getBlockHeight()
      .then(async (height) => {
        let promises = [];
        for (let z = 0; z < height - 1; z++) {
          let promise = await this.getValidateBlockPromise(z);
          promises.push(promise);
        }
        return Promise.resolve(promises);
      })
  }

}

//Starts the process for testing the Blockchain
function start() {
  let b = new Blockchain();
  let count = 0;
  (function (n) {
    return new Promise((resolve, reject) => {
      let it = setInterval(() => {
        b.addBlock(new Block(`This is a block created at ${new Date().getTime().toString().slice(0, -3)}`)).then(b => {
          console.log(b);
          count++;
          if (count >= n) {
            clearInterval(it);
            resolve();
          }
        });

      }, 100);
    });
  })(10).then(() => { // Create 10 blocks
    b.validateChain().then(promises => { // Starts the validation of the blockchain
      Promise.all(promises).then(results => {
        const blockErrors = promises.filter(p => p !== true);
        console.log(`Blocks with errors: [${blockErrors}]`);
      });
    }).then(() => {
      b.getBlock(5).then(block => {
        let blockObject = JSON.parse(block);
        blockObject.data = 'Another corrupted data';
        b.storage.addLevelDBData(5, JSON.stringify(blockObject)).then(result => {
          //Validate again
          b.validateChain().then(promises => { // Starts the validation of the blockchain
            Promise.all(promises).then(results => {
              const blockErrors = promises.filter(p => p !== true);
              console.log(`Blocks with errors: [${blockErrors}]`);
            });
          });
        }).catch(() => { });
      })
    }).catch(e => {
      console.log('Error:', e);
    });
  });
}

// Inserts the Genesis block and 10 more blocks
//start();


function runTest() {
  Blockchain.initBlockchain().then(async (bc) => {

    // Current Height
    const currentBlockHeigh = await bc.getBlockHeight();
    console.log('--------------------------------------')
    console.log(`Current height: ${currentBlockHeigh}`);

    console.log('--------------------------------------')
    // Adding 4 blocks
    const block1 = await bc.addBlock(new Block('Block #1'));
    const block2 = await bc.addBlock(new Block('Block #2'));
    const block3 = await bc.addBlock(new Block('Block #3'));
    const block4 = await bc.addBlock(new Block('Block #4'));
    const blocks = [block1, block2, block3, block4];
    console.log(`4 Blocks added: [${blocks}]`);
  });

}

runTest();