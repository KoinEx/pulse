import {protocol,host,port} from '../config/settings';
import {Database_Controllers,Channel_Names} from '../constants/enums';

export default class AccountService {
  constructor($http,StorageService){
    this.http = $http;
    this.store =StorageService;
    this.baseurl = `${protocol}://${host}:${port}`;    
  }


  async createAccount(wallet){
    const port = chrome.runtime.connect({name: Channel_Names.GET_TXN_ID});
    port.postMessage({message:'give me the txn id'});
    port.onMessage.addListener((message)=>{wallet.Id = (message.id || '');});
    const network = await this.store.get(Database_Controllers.NETWORK_CONTROLLER.NAME);

    if(network) {
      wallet.network = network.type;
    }

    return new Promise((resolve,reject)=>{
      this.http.post(`${this.baseurl}/api/wallet/registration`,wallet).then((result)=>{
        resolve(result);
      }).catch((error)=>{
        console.error(error);
        reject(error.data ? error.data.message : "something went wrong");
      });
    });
    
  }

}

AccountService.$inject = ['$http','StorageService'];