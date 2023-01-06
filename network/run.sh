#!/bin/bash

cd bnode
nohup bootnode -nodekey boot.key -verbosity 7 -addr 127.0.0.1:30301 &
echo "bootnode started"

cd ../node1
nohup geth --networkid 14333 \
     --datadir data \
     --bootnodes "enode://21d4c2d5d3b2edfc46d6bd2eb8a9b08e08b0f67754d9114048aefa3a54279513356233afdfee96ce23121f9aa2c2b3f880b074d140513f6f1b0927a08fd0a894@127.0.0.1:0?discport=30301" \
     --port 30303 \
     --ipcdisable \
     --syncmode full \
     --gcmode=archive \
     --http \
     --allow-insecure-unlock \
     --http.api eth,net,web3,debug,mine \
     --http.corsdomain "*" \
     --http.port 8545 \
     --unlock 0x6D9F2a4D1c7863B1eFB39781af62219AE4759596 \
     --password password.txt \
     --mine &

echo "Node 1 started"


cd ../node2
nohup geth --networkid 14333 \
     --datadir data \
     --bootnodes "enode://21d4c2d5d3b2edfc46d6bd2eb8a9b08e08b0f67754d9114048aefa3a54279513356233afdfee96ce23121f9aa2c2b3f880b074d140513f6f1b0927a08fd0a894@127.0.0.1:0?discport=30301" \
     --port 30304 \
     --ipcdisable \
     --syncmode full \
     --gcmode=archive \
     --http \
     --allow-insecure-unlock \
     --http.api eth,net,web3,debug \
     --http.corsdomain "*" \
     --http.port 8546 \
     --authrpc.port 8552 \
     --unlock 0xc2184C9eD1A204C393e6193948b626907f1A5391 \
     --password password.txt &

echo "Node 2 started"