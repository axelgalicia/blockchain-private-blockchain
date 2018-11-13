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
        levelDB.addLevelDBData(0, this.getBlockAsString(this.createGenesisBlock()));
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
      this.getBlockHeight().then(height => {
        console.log(`Length: ${height}`);
        if (height === 0) {
          console.log('ADDING GENESIS FROM ADDBLOCK');
          levelDB.addLevelDBData(0, this.getBlockAsString(newBlock));
        } 
          // Block height
          newBlock.height = height;
          // UTC timestamp
          newBlock.time = this.getTimeUTC();
          // previous block hash
          if (height > 0) {
            let previousBlock = async () =>{ await levelDB.getLevelDBData(height -1) };
            console.log('PREVIOUS');
            console.log(previousBlock);
            newBlock.previousBlockHash = previousBlock.hash;
          }

          //console.log('Nuevo bloque:', newBlock);
          // Block hash with SHA256 using newBlock and converting to a string
          newBlock.hash = this.generateHash(newBlock);
          // Adding block object to chain
          levelDB.addLevelDBData(height + 1, this.getBlockAsString(newBlock));
          resolve(newBlock);
      });

    });
  }

  getBlockAsString(block) {
    return JSON.stringify(block);
  }

  // Get block height
  getBlockHeight() {
    return levelDB.length();
  }

  // get block
  getBlock(blockHeight) {
    let block = levelDB.getLevelDBData(blockHeight);
    // return object as a single string
    return JSON.parse(JSON.stringify(block));
  }

  // validate block
  validateBlock(blockHeight) {
    // get block object
    let block = this.getBlock(blockHeight);
    // get block hash
    let blockHash = block.hash;
    // remove block hash to test block integrity
    block.hash = '';
    // generate block hash
    let validBlockHash = SHA256(JSON.stringify(block)).toString();
    // Compare
    if (blockHash === validBlockHash) {
      return true;
    } else {
      console.log('Block #' + blockHeight + ' invalid hash:\n' + blockHash + '<>' + validBlockHash);
      return false;
    }
  }

  // Validate blockchain
  validateChain() {
    let errorLog = [];
    for (var i = 0; i < this.chain.length - 1; i++) {
      // validate block
      if (!this.validateBlock(i)) errorLog.push(i);
      // compare blocks hash link
      let blockHash = this.chain[i].hash;
      let previousHash = this.chain[i + 1].previousBlockHash;
      if (blockHash !== previousHash) {
        errorLog.push(i);
      }
    }
    if (errorLog.length > 0) {
      console.log('Block errors = ' + errorLog.length);
      console.log('Blocks: ' + errorLog);
    } else {
      console.log('No errors detected');
    }
  }
}
