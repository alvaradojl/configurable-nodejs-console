#!/usr/bin/env node
'use strict';
const program = require('commander'), 
      Web3 = require("web3"),
      fs    = require('fs'),
      nconf = require('nconf');


  // Setup nconf to use (in-order):
  //   1. Command-line arguments
  //   2. Environment variables
  //   3. A file located at 'path/to/config.json'
  //
  nconf.argv()
   .env()
   .file({ file: 'config.json' });
 
let web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));



function run(){

console.log("\nThe Last block number is: " + web3.eth.blockNumber);

console.log("Your default account is: " + web3.eth.defaultAccount);

let lastBlock = nconf.get('events:last_block');

console.log('last_block registered: ' + lastBlock);
console.log('community address: ' + nconf.get('contracts:community:address')); 

let contractCode = nconf.get('contracts:members:code');
//console.log('code: ' + contractCode);
let contractInterface = nconf.get('contracts:members:interface');
//let parsedInterface = JSON.parse(contractInterface);
//console.log('interface: ' + parsedInterface);
let contractAddresses = nconf.get('contracts:members:addresses');
console.log('addresses: ' + contractAddresses + ' items: ' + contractAddresses.length);


for(var i=0; i<contractAddresses.length; i++){

console.log('listening to the events of contract ' + contractAddresses);

 let contractInstance = web3.eth.contract(contractInterface).at(contractAddresses[i]);

     
contractInstance.HasIncreasedDebt({}, { fromBlock: lastBlock, toBlock: 'latest' }).watch(function (e, log) {
    if (!e) {
       console.log('\n\nYour debt has increased, transaction tx_' + log.transactionHash + ' the amount of :' + log.args.total.toString(10)  + ', for a total debt:' + log.args.debt.toString(10) + ', blockNumber:' + log.blockNumber);
    }
});

contractInstance.HasReducedDebt({}, { fromBlock: lastBlock, toBlock: 'latest' }).watch(function (e, log) {
    if (!e) {
        console.log('\n\nYour debt has been reduced, transaction tx_' + log.transactionHash + ' the amount of :' + log.args.amountDecreased.toString(10) + ', for a total debt:' + log.args.debt.toString(10) + ', blockNumber:' + log.blockNumber);
    }
});


    lastBlock = web3.eth.blockNumber;

    nconf.set('events:last_block',lastBlock);

    console.log("Last block has been updated.");

    // Save the configuration object to disk
    nconf.save(function (err) {
        if(!err){
            console.log('config file has been saved.');
        }
    });


}



}

let listenFunction = () => {

setInterval(run, 5000);

};

program
 .version('0.0.1')
  .command('listen')
  .description('Listens for the community contract events')
  .action(listenFunction);

    process.on( 'SIGINT', function() {
    console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
 
    process.exit( );
    });

program.parse(process.argv);

