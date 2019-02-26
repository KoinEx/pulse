import { Database_Controllers,Networks } from '../constants/enums';

export default class StorageService{

  //service to store data in chrome storage
  constructor(){
    this.store = chrome.storage.local;
  }

  async save(data){ // to store new created accounts or imported accounts
      let accountData=await this.get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
      const networkController =  await this.get(Database_Controllers.NETWORK_CONTROLLER.NAME),
      networkType = networkController[Database_Controllers.NETWORK_CONTROLLER.TYPE];
      accountData[`${data.account_name}_${networkType}`]=data;
      accountData[`${Database_Controllers.ACCOUNT_CONTROLLER.SELECTED}`]=`${data.account_name}_${networkType}`;
      if(!accountData[Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS]) {
        accountData[Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS]={};
        accountData[Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS][Networks.TESTNET]=[];
        accountData[Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS][Networks.LOCALNET]=[];
        accountData[Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS][Networks.MAINNET]=[];
      }
      if ( accountData[Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS][networkType].indexOf(data.account_name)<0 )
        accountData[Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS][networkType].push(data.account_name);
      const saveData = {};
      saveData[Database_Controllers.ACCOUNT_CONTROLLER.NAME] = accountData;
      await this.set(saveData);
      return Promise.resolve(true);
  }

  get(key = null){ // to get data from the storage as per the key
    return new Promise((resolve,reject)=>{
      this.store.get(key,(result,error)=>{
        if(error || result=='') reject(error);
        else resolve(result[key]);
      })
    })
  }
 
  set(controller) {  // to store data in the storage
    return new Promise((resolve,reject)=>{
      this.store.set(controller,(result,error)=>{
        if(error) reject(error);
        else resolve(true);
      });
    });
  }

  setState(currentState,redirectTo=null) { // store current state of the extension
    return new Promise((resolve,reject)=>{
      const state = {};
      state[Database_Controllers.STATE_CONTROLLER.NAME]={
        Current:currentState,
        RedirectTo:redirectTo
      }
      this.store.set(state,(result,error)=>{
        if(error || result=='') reject(error);
        else resolve(result);
      });
    });
  }

  getTransactions(){ // get all txns of the selected account
    return new Promise(async (resolve,reject)=>{
      const accountsController = await this.get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
      const selected = accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SELECTED];
      this.store.get(Database_Controllers.TRANSACTION_CONTROLLER.NAME,(result,error)=>{
        if(error || result=='') reject(error);
        else resolve(result[Database_Controllers.TRANSACTION_CONTROLLER.NAME][selected]);
      })
    })
  }

  setTransaction(data){ // store transactions of the selected account
    return new Promise(async (resolve,reject)=>{
      const accountsController = await this.get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
      const selected = accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SELECTED];
      const transactionController = await this.get(Database_Controllers.TRANSACTION_CONTROLLER.NAME);
      transactionController[selected]=data[Database_Controllers.TRANSACTION_CONTROLLER.NAME];
      const transactionData = {};
      transactionData[Database_Controllers.TRANSACTION_CONTROLLER.NAME]=transactionController;
      console.log(transactionData,"nnnnneeeewwwww");
      this.store.set(transactionData,(result,error)=>{
        if(error || result=='') reject(error);
        else resolve(result);
      });
    })
  }

  setCustomToken(tokenDetails){ // this is to store the custom tokens added by the user in pulse
    return new Promise(async (resolve,reject)=>{
      const accountsController = await this.get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
      const networkController = await this.get(Database_Controllers.NETWORK_CONTROLLER.NAME);
      const selected = accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SELECTED];
      const accounts = accountsController[Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS];
      if(accounts[networkController[Database_Controllers.NETWORK_CONTROLLER.TYPE]].length) {
        const customTokens = accountsController[selected][Database_Controllers.ACCOUNT_CONTROLLER.CUSTOM_TOKENS] || {};
        customTokens[tokenDetails.token.toUpperCase()] = tokenDetails;
        console.log("custom->",customTokens);
        accountsController[selected][Database_Controllers.ACCOUNT_CONTROLLER.CUSTOM_TOKENS] = customTokens;
      } else {
        reject(false);
      }
      const accountData = {};
      accountData[Database_Controllers.ACCOUNT_CONTROLLER.NAME]=accountsController;
      console.log("accounts DATA ->",accountData,tokenDetails);
      await this.set(accountData);
      resolve(true);
    });
  }

  clear(){ // to clear the chrome storage
    this.store.clear();
    return Promise.resolve(true);
  }

  getAll(){ // to get all data from the storage
    return new Promise((resolve,reject)=>{
      this.store.get(null,(result,error)=>{
        if(error || result=='') reject(error);
        else resolve(result);
      })
    })
  }


  delete(key){ // to delete a particular key from the storage
    this.store.remove(key);
  }
  
}

StorageService.$inject = [];