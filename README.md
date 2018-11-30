# Private Blockchain

This is an example of how to create a very basic **private blockchain** using Javascript and **LevelDB** to keep the blocks stored in the disk.

## Installation

1) Install Node.js
2) Install dependencies
  ```
  npm install
  ```
## How to use

3) Run the main file calles simpleChain.js by running the command below:

```
node simpleChain.js
```

You will see the output in the console for the blocks that are created, by default there are **4** blocks being created.

The chain is being validated and then error is introduced and validated again, showing the errors at the end.

## Screnshots

![Blocks created and validated](https://github.com/axelgalicia/blockchain-private-blockchain/blob/master/images/screenshot1.jpg)

## Using the library

To start a new blockchain please call the **initBlockchain** function directly on a Blockchain object. e.g.

```
  Blockchain.initBlockchain().then(async (bc) => {
    // Current Height
    let currentBlockHeigh = await bc.getBlockHeight();
  }
```

The **bc** parameter will contain a **new** Blockchain object ready to start calling **async** functions like:

```

Blockchain.initBlockchain().then(async (bc) => {

// Getting the current height of the blockchain
const height = await bc.getBlockHeight();

// Adding a new block
const block1 = await bc.addBlock(new Block(`Block example}`));

// Validate chain
const chainErrors = await bc.validateChain();

...

}

```


## Storage

The blockchain will be saved by default in a folder called **privatechain** located inside the folder where the application is being run.


**Author**: Axel Galicia, axelgalicia@gmail.com