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
    return new Promise((resolve, reject) => {
      this.db.put(key, value, function (err) {
        if (err) { 
          console.log('Block ' + key + ' submission failed', err);
          reject(err);
        }
        resolve(value);
      });
    });
  }

  // Get data from levelDB with key
  getLevelDBData(key) {
    return new Promise((resolve, reject) => {
      this.db.get(key, function (err, value) {
        if (err) {
             console.log('Not found!', err);
             reject();
           };
        resolve(value);
        //console.log('Value = ' + value);
      })
    });
  }

  // Add data to levelDB with value
 addDataToLevelDB(value) {
    let i = -1;
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
      let i = -1;
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
  printAllData() {
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

module.exports = {
  Storage
}
