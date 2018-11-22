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
        levelDB.addLevelDBData(0, this.getBlockAsString(this.createGenesisBlock())).then((b) => {
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

  getBlockAsString(block) {
    return JSON.stringify(block);
  }

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

  // validate block
  validateBlock(blockHeight) {

    return new Promise((resolve, reject) => {
        // get block object
        this.getBlock(blockHeight).then(block => {
              let blockObject = this.getBlockFromString(block);
              // get block hash
              let blockHash = blockObject.hash;
              // remove block hash to test block integrity
              blockObject.hash = '';
              // generate block hash
              let validBlockHash = SHA256(JSON.stringify(blockObject)).toString();
              // Compare
              if (blockHash === validBlockHash) {
                resolve(true);
              } else {
                console.log('Block #' + blockHeight + ' invalid hash:\n' + blockHash + '<>' + validBlockHash);
                reject(blockHeight);
              }
        });
    });
    
    
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


function start() {
  let b = new Blockchain();
  let count = 0;
  (function (n) {
    return new Promise((resolve,reject) => {
      let it = setInterval(() => {
        b.addBlock(new Block(`Block #${count + 1}`)).then(b => {
          console.log(b);
          count++;
          if (count >= n) {
            clearInterval(it);
            resolve();
          }
        });
  
      }, 100);
    });
  })(10).then(() =>{
     b.validateBlock(10).then(r => {
       console.log(r);
     });
  });
}

// Inserts the Genesis block and 10 more blocks
start();