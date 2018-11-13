/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require('level');

class Storage {

  constructor(dataLocation) {
    this.db = level(dataLocation);
  }
  // Add data to levelDB with key/value pair
  addLevelDBData(key, value) {
    this.db.put(key, value, function (err) {
      if (err) return console.log('Block ' + key + ' submission failed', err);
    });
  }

  // Get data from levelDB with key
  getLevelDBData(key) {
    this.db.get(key, function (err, value) {
      if (err) return console.log('Not found!', err);
      console.log('Value = ' + value);
    })
  }

  // Add data to levelDB with value
  async addDataToLevelDB(value) {
    let self = this;
    let i = 0;
    return new Promise((resolve, reject) => {
      this.db.createReadStream().on('data', function (data) {
        i++;
      }).on('error', function (err) {
        console.log('Unable to read data stream!', err);
        reject(err);
      }).on('close', function () {
        console.log('Block #' + i);
        self.addLevelDBData(i, value);
        resolve(value);
      });

    });

  }

    // Get count of elements from db
    length() {
      let self = this;
      let i = 0;
      return new Promise((resolve, reject) => {
        this.db.createReadStream().on('data', function (data) {
          i++;
        }).on('error', function (err) {
          console.log('Unable to read data stream!', err);
          reject(err);
        }).on('close', function () {
          resolve(i);
        });
  
      });
  
    }


  // Prints all data in the db
  async printAllData() {
    let self = this;
    let i = 0;
    return new Promise((resolve, reject) => {
      this.db.createReadStream().on('data', function (data) {
        console.log(data);
        i++;
      }).on('error', function (err) {
        console.log('Unable to read data stream!', err);
        reject(err);
      }).on('close', function () {
        resolve(true);
      });

    });

  }


}


/* ===== Test class for Storage ===================================*/
class TestStorage {

  constructor(locationTest) {
    this.db = new Storage(locationTest);
  }

  // Insert i items into the storage using i as a key
  async insert(i) {
    let self = this;
    for (let z = 0; z < i; z++) {
      let promise = await self.db.addDataToLevelDB(`Testing data ${z}`);
      console.log(promise);
    }
  }
  // Reads all the storage db and print all the values
  async printAll() {
    let self = this;
    let promise = await self.db.printAllData();
  }

    // Reads all the storage db and returns cound of elements
  async length() {
    let self = this;
    return self.db.length();
  }
}

// IIFE that inserts i elements and then print them
// Uncomment to test
/*
(async function (i) {
  let testStorage = new TestStorage('./testchain');
  await testStorage.insert(i);
  console.log('Printing chain:');
  await testStorage.printAll();
  console.log('Length: ' + await testStorage.length());
})(10);*/


module.exports = {
  Storage
}
