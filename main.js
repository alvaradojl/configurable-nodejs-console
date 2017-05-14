#!/usr/bin/env node
'use strict';

const program = require('commander'), //used as command line options parser
      Web3 = require("web3"), //used to connect to ethereum network
      nconf = require('nconf'); //used to get/set config settings


  // Setup nconf to use (in-order):
  //   1. Command-line arguments
  //   2. Environment variables
  //   3. A file located at 'path/to/config.json'
  nconf.argv()
   .env()
   .file({ file: 'config.json' });
 
let web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); //instantiate it with the local node
 
function run(){

//get the latest block number listened
let lastBlockListened = nconf.get('events:last_block');
let lastBlockInNetwork = web3.eth.blockNumber;
let contractCode = nconf.get('contracts:members:code');
let contractInterface = nconf.get('contracts:members:interface');
let contractAddresses = nconf.get('contracts:members:addresses'); //it is an array of addresses of the member contracts in the community

//print everything you got :)
console.log('***************************');
console.log("The last block number is: " + lastBlockInNetwork);
console.log('The Member contract addresses: ' + contractAddresses + ' items: ' + contractAddresses.length);
console.log('The last_block registered in config file: ' + lastBlockListened);
console.log('The community address registered in config file: ' + nconf.get('contracts:community:address')); 

for(var i=0; i<contractAddresses.length; i++){

console.log('Listening to the events of member contract: ' + contractAddresses);

let contractInstance = web3.eth.contract(contractInterface).at(contractAddresses[i]); //instantiate contract
   
//listen to the events - starting from the last block number registered in the config file
contractInstance.HasIncreasedDebt({}, { fromBlock: lastBlockListened, toBlock: 'latest' }).watch(function (e, log) {
    if (!e) {
       console.log('Your debt has increased, transaction tx_' + log.transactionHash + ' the amount of :' + log.args.total.toString(10)  + ', for a total debt:' + log.args.debt.toString(10) + ', blockNumber:' + log.blockNumber);
    }
});

contractInstance.HasReducedDebt({}, { fromBlock: lastBlockListened, toBlock: 'latest' }).watch(function (e, log) {
    if (!e) {
        console.log('Your debt has been reduced, transaction tx_' + log.transactionHash + ' the amount of :' + log.args.amountDecreased.toString(10) + ', for a total debt:' + log.args.debt.toString(10) + ', blockNumber:' + log.blockNumber);
    }
});

//update the config file with the latest block in the network
nconf.set('events:last_block',lastBlockInNetwork);

// Save the configuration object to disk
nconf.save(function (err) {
    if(!err){
        console.log('Config file has been updated.');
    }
});
}
}

let listenFunction = () => {
//run indefinitely every 5 seconds
setInterval(run, 5000);

};

program
 .version('0.0.1')
  .command('listen')
  .description('Listens for the member contract events to create invoices and send them to customers')
  .action(listenFunction);

    process.on( 'SIGINT', function() {
    console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
 
    process.exit( );
    });

program.parse(process.argv);

