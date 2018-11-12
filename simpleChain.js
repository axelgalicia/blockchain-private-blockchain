/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
import { Store } from './levelSandbox';



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
  constructor(dataLocation) {
    this.chain = new Store(dataLocation);
    this.addBlock(createGenesisBlock());
  }

  //Returns a new Block which will be used as Genesis block
  createGenesisBlock() {
    const genesisBlock = new Block('First block in the chain');
    genesisBlock.height = 0;
    genesisBlock.time = getTimeUTC();
    genesisBlock.hash = generateHash(genesisBlock);
    return genesisBlock;
  }

  //Returns the SHA256 of the block passed
  generateHash(block) {
    return SHA256(JSON.stringify(block)).toString();
  }

  getTimeUTC() {
    return new Date().getTime().toString().slice(0, -3);
  }

  // Add new block
  async addBlock(newBlock) {

    //Verify genesis block exists
    const chainLength = await this.chain.length();
    if(chainLength < 1 ) {
      await this.chain.addBlock(0, createGenesisBlock());
    }
    // Block height
    newBlock.height = await this.chain.length();
    // UTC timestamp
    newBlock.time =getTimeUTC();
    // previous block hash
    if (this.chain.length > 0) {
      newBlock.previousBlockHash = this.chain[this.chain.length - 1].hash;
    }
    // Block hash with SHA256 using newBlock and converting to a string
    newBlock.hash = generateHash(newBlock);
    // Adding block object to chain
    this.chain.push(newBlock);
  }

  // Get block height
  getBlockHeight() {
    return this.chain.length - 1;
  }

  // get block
  getBlock(blockHeight) {
    // return object as a single string
    return JSON.parse(JSON.stringify(this.chain[blockHeight]));
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
