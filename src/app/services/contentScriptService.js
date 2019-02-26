// import to from 'await-to-js';
import {config} from '../config/config';
import Eos from 'eosjs';

import { Database_Controllers,External_Channels,Extention } from '../constants/enums';

class ContentScriptService{
  // this whole script is injected on every js enabled page
  // every event dispatched from here will be capture by the contentscript.js

  constructor(){
    this.network = '';
    this.init();
  }

  async init(){
    this.extentionID = Extention.ID;
    window.dispatchEvent(new Event(External_Channels.GETDATA)); 
    window.addEventListener(External_Channels.GETDATA_RES,(response)=>{
      this.network = response.detail[Database_Controllers.NETWORK_CONTROLLER.TYPE];
    });
  }

  sendTransaction(transactionObject){ // to handle the transactions from  the other dapps
    
    return new Promise(async (resolve,reject)=>{
      window.dispatchEvent(new CustomEvent(External_Channels.SEND,{detail:transactionObject}));
      window.addEventListener(External_Channels.SEND_RES,(response)=>{
        if(response.detail.status == 'success') {
          resolve(response.detail);
        } else{
          reject(response.detail);
        }
      });
    });
  }

  connect(){ // to handle the connections of dapps
    return new Promise(async (resolve,reject)=>{
      window.dispatchEvent(new Event(External_Channels.CONNECT));
      window.addEventListener(External_Channels.CONNECT_RES,(response)=>{
        if(response.detail.status == 'success'){
          resolve(response.detail);
        } else {
          reject(response.detail);
        }
      });
    });
  }

  sendCustomAction(contract,action,data){ // to handle the custom actions from  the other dapps
    return new Promise(async (resolve,reject)=>{
      window.dispatchEvent(new CustomEvent(External_Channels.SEND_CUSTOM_ACTION,{detail:{contract,action,data}}));
      window.addEventListener(External_Channels.SEND_CUSTOM_ACTION_RESPONSE,(response)=>{
        if(response.detail.status == 'success'){
          resolve(response.detail);
        } else {
          reject(response.detail);
        }
      });
    });
  }
}

ContentScriptService.$inject = [];

window.pulse = new ContentScriptService();
window.eosController = Eos;