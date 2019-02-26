import to from 'await-to-js';
import { config } from '../config/config';
import { Channel_Names, Database_Controllers, Networks } from '../constants/enums';


export default class EosService {
  // servece to access all the eos blockchain functions

  constructor(StorageService,AccountService,EncryptionService){
    this.ecc = eosjs_ecc;
    this.configEos = {};
    eosjs_ecc =undefined;
    this.store = StorageService;
    this.accountService = AccountService;
    this.DecimalPad = Eos.modules.format.DecimalPad;
    this.accountsController = {};
    this.encryptionService =EncryptionService;
    this.init();
  }

  async init() {
    this.accountsController = await this.store.get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
    await this.initialize();
  }


  async getInfo(httpEndpoint){ // get info of the current node
    const eos = Eos({httpEndpoint});
    return eos.getInfo({});
  }

  async initialize(passkey = null,contract=null){ // to initialize the eos object

    const networkController = await this.store.get(Database_Controllers.NETWORK_CONTROLLER.NAME); // to get the current network status
    this.networkType = networkController[Database_Controllers.NETWORK_CONTROLLER.TYPE]; // to get the selected network
    const CUSTOM_NETWORKS = networkController[Database_Controllers.NETWORK_CONTROLLER.CUSTOM_NETWORKS] || {};
    if(!CUSTOM_NETWORKS[this.networkType]) { // to check if the current network is a custom network or default once and then initialize the config accordingily
      this.configEos = config[this.networkType]['configEos'];
    } else {
      const network = CUSTOM_NETWORKS[this.networkType];
      this.configEos = config[Networks.LOCALNET]['configEos'];
      this.configEos.httpEndpoint = `${network.protocol}://${network.host}:${network.port}`;
      this.configEos.chainId = network.chainId;
    }
    
    const localConfigForEos = Object.create(this.configEos), // for deep copying
          localEos = Eos(localConfigForEos);
    if (passkey) {
      const expireInSeconds = 60 * 60,// 1 hour
          Contract = contract ? await localEos.getAbi({account_name:contract}): {abi:''}, // getting the abi of the current contract
          info = await localEos.getInfo({}),
          chainDate = new Date(info.head_block_time + 'Z'),
          block = await localEos.getBlock(info.last_irreversible_block_num);
      let  expiration = new Date(chainDate.getTime() + expireInSeconds * 1000);
           expiration = expiration.toISOString().split('.')[0];
      const transactionHeaders = {
            expiration,
            ref_block_num: info.last_irreversible_block_num & 0xFFFF,
            ref_block_prefix: block.ref_block_prefix
          };
      localConfigForEos.httpEndpoint = null; // to just sign the transaction not pushing to the blockchain
      localConfigForEos.transactionHeaders = transactionHeaders;
      this.accountsController = await this.store.get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
      const selected = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SELECTED];
      const userData = this.accountsController[selected];
      localConfigForEos.keyProvider =[`${await this.encryptionService.decrypt(passkey,userData.keyManager)}`];
      return Promise.resolve({eos:Eos(localConfigForEos),abi:Contract.abi});
      // configEos.;
    }
    console.log(localEos);
    return Promise.resolve(Eos(localConfigForEos));
  }

  createAccount(name,deviceID,memo){ // to create new account on the blockchain
    return new Promise(async (resolve,reject)=>{
      const networkController = await this.store.get(Database_Controllers.NETWORK_CONTROLLER.NAME),
            networkType = networkController[Database_Controllers.NETWORK_CONTROLLER.TYPE];

      if(Networks.MAINNET != networkType && Networks.TESTNET != networkType){
        reject({msg:`unable to create account on ${networkType} network`});
      }

      this.ecc.randomKey().then( async (key) => {
        let owner = '';
        const active = owner = this.ecc.privateToPublic(key);
        const [error] = await to(this.getAccountByName({account_name:name})); // its a check wheathere account is already present with this name or not
        if(error){
          const [error,data] = await to (this.accountService.createAccount({ name:name,owner,active,deviceID,memo })); // check account service for more details
          if (error){
            reject({success:false,msg:error});
          }
          resolve({success:true,msg:data,key:key});
        }
        else {
          reject({success:false,msg:'Account name already taken'});
        } 
      });
    });
  }

  privateToPublic(key) { // to convert private key to public key
    try{
      return Promise.resolve( this.ecc.privateToPublic(key) );
    } catch(error) {
      return Promise.resolve(false);
    }
  }

  isvalidPrivateKey(key){ // to validate a private key
    return this.ecc.isValidPrivate(key);
  }


  async getAccountByName({account_name}){  // to get an account details using  name from blockchian
    const eos = await this.initialize();
    return eos.getAccount({account_name});
  }

  async getCurrencyBalance({account,code,symbol}){
    const eos = await this.initialize();
    return eos.getCurrencyBalance({account,code,symbol});
  }

  pushTransaction(transctionData){  // to push transaction through background script
    const port = chrome.runtime.connect({name:Channel_Names.TRANSFER_FUNDS}); // this is to connect to the background script on the particular channel name
    port.postMessage({transaction:`${JSON.stringify(transctionData.transaction)}`}); // sending messsage 
    return new Promise((resolve,reject)=>{
      port.onMessage.addListener((result)=>{ // listner for the response from the background script
        if(result.status == "success"){
          resolve(result.response);
          port.disconnect();
        } else {
          reject(JSON.parse(result.error));
          port.disconnect();
        }
      });
    });
  }

  async transfer_amount(contract,from,passKey,decimalPrecision,{to,amount,memo,symbol}){ // to create a transaction object
    let {eos,abi} = await this.initialize(passKey,contract);
    eos.fc.abiCache.abi(contract, abi);
    amount = this.DecimalPad(amount,decimalPrecision);
    const options = {authorization: from}
    const transctionData = await eos.transaction(contract,(currentContract)=>{currentContract.transfer(from, to, `${amount} ${symbol.toUpperCase()}`, (memo || ' '),options);});
    await this.initialize();
    return await this.pushTransaction(transctionData);
  }

  async verifyTxn(txnID){ // to verify the transaction for creating acount on mainnet
    const port = chrome.runtime.connect({name:Channel_Names.GET_TRANSACTION}); // to get the transaction details from the blockchain throught bg script
    port.postMessage({transaction:`${JSON.stringify({id:txnID,block_num_hint:0})}`});
    return new Promise((resolve,reject)=>{
      port.onMessage.addListener((result)=>{
        if(result.status == "success"){
          resolve(result.response);
          port.disconnect();
        } else {
          reject(result.error);
          port.disconnect();
        }
      });
    });
  }

  async customActions(contract,from,action,passKey,data){ // to handle custom actions of contarcts
    try{
      const {eos,abi} = await this.initialize(passKey,contract); 
      eos.fc.abiCache.abi(contract, abi);
      console.log(data);
      const transctionData = await eos.transaction(
        {
          actions: [
            {
              account: contract,
              name: action,
              authorization: [{
                actor: from,
                permission: 'active'
              }],
              data: data
            }
          ]
        }
      )
      await this.initialize();
      return await this.pushTransaction(transctionData);
    } catch(error) {
      return Promise.reject(error);
    }
  }

  async delegate(password,decimalPrecision,{from,receiver,CPU_quantity,net_quantity,symbol}){ // to delegatr the CPU
    const {eos} = await this.initialize(password);  
    const transctionData =  await eos.delegatebw({from,receiver,stake_cpu_quantity:`${this.DecimalPad(CPU_quantity,decimalPrecision)} ${symbol}`,stake_net_quantity:`${this.DecimalPad(net_quantity,decimalPrecision)} ${symbol}`,transfer:0});
    await this.initialize();
    console.log(transctionData);
    return await this.pushTransaction(transctionData);
  }

  async undelegate(password,decimalPrecision,{from,receiver,CPU_quantity,net_quantity,symbol}){ // to undelegate the cpu
    const {eos} = await this.initialize(password);  
    const transctionData = await eos.undelegatebw({from,receiver,unstake_cpu_quantity:`${this.DecimalPad(CPU_quantity,decimalPrecision)} ${symbol}`,unstake_net_quantity:`${this.DecimalPad(net_quantity,decimalPrecision)} ${symbol}`});
    await this.initialize();
    return await this.pushTransaction(transctionData);
  }

}



EosService.$inject = ['StorageService','AccountService','EncryptionService'];