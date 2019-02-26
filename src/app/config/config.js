const testnet = {
    configEos:{
        chainId: 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473', // 32 byte (64 char) hex string //038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca
        keyProvider: [], // WIF string or array of keys..
        httpEndpoint: 'https://api.jungle.alohaeos.com:443',   // httpEndPoint of Blockchain Node
        expireInSeconds: 60,
        broadcast: true,
        verbose: false, 
        sign: true
    },
    creator:'testnet2eosw',
    precision : 4,
    fees:'0.0000 EOS'
};

const mainnet = {
    configEos:{
        chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906', // 32 byte (64 char) hex string //038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca
        keyProvider: [], // WIF string or array of keys..
        httpEndpoint: 'https://api.eossweden.se',  //httpEndPoint of Blockchain Node
        expireInSeconds: 60,
        broadcast: true,
        verbose: false, 
        sign: true
    },
    creator:'pulseaccount',
    precision : 4,
    fees:'0.4000 EOS'
};


const config = {
    testnet,
    mainnet
};

// config for eos default networks we are providing 

module.exports = {config};