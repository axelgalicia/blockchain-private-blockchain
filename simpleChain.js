/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
const levelDB = new (require('./levelSandbox')).Storage('./privatechain');

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
  constructor() {
    levelDB.length().then(length => {
      if (length === 0) {
        const genesisBlock = this.getBlockAsString(this.createGenesisBlock());
        levelDB.addLevelDBData(0, genesisBlock).then((b) => {
          console.log('Genesis block created');
        });
      }
    }).catch(err => {
      console.log(err);
    });
  }


  //Returns a new Block which will be used as Genesis block
  createGenesisBlock() {
    const genesisBlock = new Block('First block in the chain');
    genesisBlock.height = 0;
    genesisBlock.time = this.getTimeUTC();
    genesisBlock.hash = this.generateHash(genesisBlock);
    return genesisBlock;
  }

  // Returns the SHA256 of the block passed
  generateHash(block) {
    return SHA256(JSON.stringify(block)).toString();
  }

  // Returns the current timestamp in the UTC format
  getTimeUTC() {
    return new Date().getTime().toString().slice(0, -3);
  }

  // Add new block
  addBlock(newBlock) {
    return new Promise((resolve, reject) => {
      // Verify genesis block exists
      this.getBlockHeight().then(currentHeight => {
        if (currentHeight === 0) {
          console.log('ADDING GENESIS FROM ADDBLOCK');
          (async () => { await levelDB.addLevelDBData(0, this.getBlockAsString(newBlock)) })();
        }
        // Block height
        newBlock.height = currentHeight;
        // UTC timestamp
        newBlock.time = this.getTimeUTC();
        // previous block hash
        (async () => {
          let previousBlock = await levelDB.getLevelDBData(currentHeight - 1);
          // Assign previous block hash
          newBlock.previousBlockHash = this.getBlockFromString(previousBlock).hash;
          // Block hash with SHA256 using newBlock and converting to a string
          newBlock.hash = this.generateHash(newBlock);
          // Adding block object to chain
          levelDB.addLevelDBData(currentHeight, this.getBlockAsString(newBlock)).then(block => {
            resolve(block);
          }).catch(err => {
            reject(err);
          });

        })();
      });

    });
  }
  // Converts the block object to string
  getBlockAsString(block) {
    return JSON.stringify(block);
  }
  // Converts the block string to object
  getBlockFromString(block) {
    return JSON.parse(block);
  }

  // Get block height
  getBlockHeight() {
    return levelDB.length();
  }

  // get block
  getBlock(blockHeight) {
    return levelDB.getLevelDBData(blockHeight);
  }

  // validate block - Returns the block heigh if the block is not valid
  async validateBlock(blockHeight) {
    // get block object
    const blockString = await this.getBlock(blockHeight);
    const blockObject = this.getBlockFromString(blockString);
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
      console.log('Block #' + blockHeight + ' invalid hash:\n' + blockHash + '<>' + validBlockHash);
      return blockHeight;
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
    let nextBlockObject = this.getBlockFromString(nextBlock);
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
    }).catch(e => {
      console.log('Error:', e);
    });
  });
}

// Inserts the Genesis block and 10 more blocks
start();