
import { config } from './app/config/config';
import { host,port,protocol } from './app/config/settings';
import { to } from 'await-to-js';
import request from 'request-promise';
import { Transaction_Status,Channel_Names,Conversion_Rates,Database_Controllers,Networks,Error_Codes,External_Channels } from './app/constants/enums';
import Eos from 'eosjs';
let configEos = {}, eos = {},tabId=0,Host='',checkForPendingTransactions,tokenList={},networkType,IS_JOB_RUNNING=false,txn_id;
const allowedWebsites = {},store = chrome.storage.local,base_url= `${protocol}://${host}:${port}`;


// background daemon script

const init = async ()=>{ // initialize the network and eos and add network monitor event
  const networkController = await get(Database_Controllers.NETWORK_CONTROLLER.NAME),
  CUSTOM_NETWORKS= networkController[Database_Controllers.NETWORK_CONTROLLER.CUSTOM_NETWORKS] || {};
  networkType = networkController[Database_Controllers.NETWORK_CONTROLLER.TYPE];
  if(!CUSTOM_NETWORKS[networkType]) {
    configEos = config[networkType]['configEos'];
  } else {
    const network = CUSTOM_NETWORKS[networkType];
    configEos = config[Networks.LOCALNET]['configEos'];
    configEos.httpEndpoint = `${network.protocol}://${network.host}:${network.port}`;
    configEos.chainId = network.chainId;
  }
  eos = Eos(configEos);
  addNewEvent();
};


const getConversionRates = async ()=>{ // to get conversion rate from our servers
  const accountController = await get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
  const conversionRates = {},
  promises = [],
  customTokens = accountController[Database_Controllers.ACCOUNT_CONTROLLER.TOKENS] || [];
  conversionRates[Conversion_Rates.NAME] = {};
  customTokens.map(async (token)=>{
    promises.push(request.post(`${base_url}/api/market/current_price`,{form:{base:token.split(' ')[1]},headers:{'content-type': 'application/json'}}));
  });

  const [error,allData] = await to(Promise.all(promises));
  let i =0;
  if(!error){
    allData.map((conversionDetails)=>{
      i+=1;
      console.log(conversionDetails,i);
      if(conversionDetails != "null"){
        conversionDetails = JSON.parse(conversionDetails);
        conversionRates[Conversion_Rates.NAME][conversionDetails.symbol] = conversionDetails.data;
      }
    });
    if(Object.keys(conversionRates[Conversion_Rates.NAME]).length){
      await set(conversionRates);
    }
  }
}


const set = (data) =>{ // store data to chrome storage
  return new Promise((resolve,reject)=>{
    store.set(data,(result,error)=>{
      if(error || result=='') reject(error);
      else resolve(result);
    });
  });
}

const get = (key = null) =>{ // get data to chrome storage
  return new Promise((resolve,reject)=>{
    store.get(key,(result,error)=>{
      if(error || result=='') reject(error);
      else resolve(result[key]);
    })
  })
}

const getTransactions = () => { // get Transactions to chrome storage
  return new Promise(async (resolve,reject)=>{
    const accountsController = await get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
    const selected = accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SELECTED];
    store.get(Database_Controllers.TRANSACTION_CONTROLLER.NAME,(result,error)=>{
      if(error || result=='') reject(error);
      else resolve(result[Database_Controllers.TRANSACTION_CONTROLLER.NAME][selected]);
    })
  })
}

const setTransaction=(data)=>{ // set Transactions to chrome storage
  return new Promise(async (resolve,reject)=>{
    const accountsController = await get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
    const selected = accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SELECTED];
    const transactionController = await get(Database_Controllers.TRANSACTION_CONTROLLER.NAME);
    transactionController[selected]=data[Database_Controllers.TRANSACTION_CONTROLLER.NAME];
    const transactionData = {};
    transactionData[Database_Controllers.TRANSACTION_CONTROLLER.NAME]=transactionController;
    store.set(transactionData,(result,error)=>{
      if(error || result=='') reject(error);
      else resolve(result);
    });
  })
}

const storeTransaction = async (message)=>{ // store a temp transaction
  const transactionController = await getTransactions() || {};
  transactionController[Database_Controllers.TRANSACTION_CONTROLLER.TRANSACTION] = message;
  const transactionData = {};
  transactionData[Database_Controllers.TRANSACTION_CONTROLLER.NAME] = transactionController;
  setTransaction(transactionData);
}


const addHostToAllowedList = (Host)=>{ // check if requestor is allowed or not to access the data
  allowedWebsites[Host]=true;
}

const checkIfAlreadyAllowed = (Host) =>{ // check if requestor is already allowed
  return new Promise((resolve,reject)=>{
    if(allowedWebsites[Host]){
      reject(true);
    } else {
      resolve(true);
    }
  });
}


const checkSelectedAccount = async (Host) => {
    const accountsController  = await get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
    if(accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SELECTED]) {
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
}

const isCommunicationAllowed = async ()=>{ // check if communation is allowed (private mode)
  const communicationController = await get(Database_Controllers.COMMUCATION_CONTROLLER.NAME);
  if(communicationController[Database_Controllers.COMMUCATION_CONTROLLER.PRIVACY_MODE]){
    return Promise.resolve(true);
  } else {
    return Promise.resolve(false);
  }
}

const isAllowed = async (host) =>{ 
  if( await checkSelectedAccount() && await isCommunicationAllowed() && allowedWebsites[host] ){
    return Promise.resolve(true);
  } else {
    return Promise.resolve(false);
  }
}

const getEosBalance = async currency_balances =>{ // get eos balance 
  return new Promise((resolve,reject)=>{
    currency_balances.map((currency)=>{
      if(currency.split(' ')[1].toLowerCase() == 'eos') {
        resolve(currency.split(' ')[0]);
      }
    });
    resolve(0);
  });
}

const syncBalance = async () => { // sync users balance
  const accountsController = await get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
  if(accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SELECTED]){
    let account_name = accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SELECTED],
    promises=[];
    const customTokens =  accountsController[account_name][Database_Controllers.ACCOUNT_CONTROLLER.CUSTOM_TOKENS] || {},
    accountInfo = await eos.getAccount({account_name:account_name.split('_')[0]}),
    currency_balances = await eos.getCurrencyBalance({account:account_name.split('_')[0],code:'eosio.token'});
    Object.keys(customTokens).map(async (token)=>{
      promises.push(eos.getCurrencyBalance({account:account_name.split('_')[0],code:customTokens[token].contract,symbol:customTokens[token].token}));
    });
    try{
      const allPromises = await Promise.all(promises);
      allPromises.forEach((balance)=>{
        if(balance.length) currency_balances.push(balance[0]);
      });
    } catch(error){
      //
      return false;
    } finally{
      const userData= accountsController[account_name];
      userData.balance = await getEosBalance(currency_balances);
      userData.cpu_limit = accountInfo.cpu_limit;
      userData.net_limit = accountInfo.net_limit;
      accountsController[account_name]=userData;
      accountsController[Database_Controllers.ACCOUNT_CONTROLLER.TOKENS]=currency_balances;
      const accountsData = {}
      accountsData[Database_Controllers.ACCOUNT_CONTROLLER.NAME] = accountsController;
      await set(accountsData);
      return true;
    }
  
  } else {
    return false;
  }
}

const pushTransaction = (transaction) => { // push transaction to the blockchain
  return eos.pushTransaction(transaction);
}

const getTransaction = (transaction) => { // get transaction from the blockchain
  return eos.getTransaction(transaction);
}

const checkLastIrreversibleBlock = async () => { // check for transaction confirmation
  let transactionsController = await getTransactions() || {};
  let pendingTransactions = transactionsController[Database_Controllers.TRANSACTION_CONTROLLER.PENDING] || [];
  let transactions = transactionsController[Database_Controllers.TRANSACTION_CONTROLLER.HISTORY] || [];
  if(pendingTransactions.length > 0) {
    let nodeInfo = await eos.getInfo({});
    pendingTransactions.map((index)=>{
      if(transactions[index].blockNumber <= nodeInfo.last_irreversible_block_num ) {
        transactions[index].status = Transaction_Status.COMPLETED;
        transactions[index].completed_at = Date.now();
        if(transactions[index].action == 'transfer') {
          chrome.notifications.create(transactions[index].id,{type:"basic",message:`Transaction for ${transactions[index].data.quantity} confirmed`,iconUrl:'/assets/images/logo-128.png',title:'EOS PULSE'});
        } else if(transactions[index].action == 'delegatebw' || transactions[index].action == 'undelegatebw') {
          chrome.notifications.create(transactions[index].id,{type:"basic",message:`Transaction of ${transactions[index].action} confirmed`,iconUrl:'/assets/images/logo-128.png',title:'EOS PULSE'});
        }
        pendingTransactions.shift();
      }
    });
    transactionsController[Database_Controllers.TRANSACTION_CONTROLLER.HISTORY]=transactions;
    transactionsController[Database_Controllers.TRANSACTION_CONTROLLER.PENDING]=pendingTransactions;
    const transactionData = {}
    transactionData[Database_Controllers.TRANSACTION_CONTROLLER.NAME] = transactionsController;
    await setTransaction(transactionData);
  } else {
    clearInterval(checkForPendingTransactions);
    IS_JOB_RUNNING=false;
  }
}

const networkChanged = () => { // if network changed initialize with new config
  init();
}

const bootstrap = async ()=>{ // initialize the extention with neccesary data on installation
  networkType=Networks.TESTNET;
  const FirstConfig = {};
  FirstConfig['onboarding']=true;
  FirstConfig[Database_Controllers.FORGOT_PASSWORD] = false;
  FirstConfig[Database_Controllers.ACCOUNT_CONTROLLER.NAME]= {};
  FirstConfig[Database_Controllers.TRANSACTION_CONTROLLER.NAME]= {};
  FirstConfig[Database_Controllers.POLICY_CONTROLLER]= {};
  FirstConfig[Database_Controllers.STATE_CONTROLLER.NAME]= {};
  FirstConfig[Database_Controllers.EXTRA.NAME]= {};
  FirstConfig[Conversion_Rates.NAME]= {};
  FirstConfig[Database_Controllers.VERSION_CONTROLLER]= {};
  FirstConfig[Database_Controllers.NETWORK_CONTROLLER.NAME] = {}
  FirstConfig[Database_Controllers.COMMUCATION_CONTROLLER.NAME] = {}
  FirstConfig[Database_Controllers.ACCOUNT_CONTROLLER.NAME][Database_Controllers.ACCOUNT_CONTROLLER.DEFAULT_CURRENCY] = 'USD';
  FirstConfig[Database_Controllers.ACCOUNT_CONTROLLER.NAME][Database_Controllers.ACCOUNT_CONTROLLER.DEFAULT_TOKEN] = 'EOS';
  FirstConfig[Database_Controllers.ACCOUNT_CONTROLLER.NAME][Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS] = {};
  FirstConfig[Database_Controllers.STATE_CONTROLLER.NAME][Database_Controllers.STATE_CONTROLLER.CURRENT] = 'welcome';
  FirstConfig[Database_Controllers.ACCOUNT_CONTROLLER.NAME][Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS][Networks.TESTNET] = [];
  FirstConfig[Database_Controllers.ACCOUNT_CONTROLLER.NAME][Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS][Networks.MAINNET] = [];
  FirstConfig[Database_Controllers.ACCOUNT_CONTROLLER.NAME][Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS][Networks.LOCALNET] = [];
  FirstConfig[Database_Controllers.NETWORK_CONTROLLER.NAME][Database_Controllers.NETWORK_CONTROLLER.TYPE]=Networks.TESTNET;
  FirstConfig[Database_Controllers.COMMUCATION_CONTROLLER.NAME][Database_Controllers.COMMUCATION_CONTROLLER.PRIVACY_MODE] = true;
  await set(FirstConfig);
  await init();
  chrome.runtime.onInstalled.removeListener(bootstrap);
}



const addNewEvent = async ()=>{ // add an network moniter to check for any pushtransactions
  if(chrome.webRequest.onCompleted.hasListeners()) {
    chrome.webRequest.onCompleted.removeListener(networkMonitor);
    chrome.webRequest.onCompleted.addListener(networkMonitor,{urls: [`${configEos.httpEndpoint}/v1/chain/push_transaction`]});
  } else {
    chrome.webRequest.onCompleted.addListener(networkMonitor,{urls: [`${configEos.httpEndpoint}/v1/chain/push_transaction`]});
  }
  if(!IS_JOB_RUNNING){
    checkForPendingTransactions = setInterval(checkLastIrreversibleBlock,5000); 
    IS_JOB_RUNNING = true;
  }
}


const networkMonitor = async (details) => { // to start checking for the confirm transaction
  if(!IS_JOB_RUNNING){
    checkForPendingTransactions = setInterval(checkLastIrreversibleBlock,5000);
    IS_JOB_RUNNING=true;
  }
}


chrome.notifications.onClicked.addListener(async (id)=>{
  const network = (await get(Database_Controllers.NETWORK_CONTROLLER.NAME))[Database_Controllers.NETWORK_CONTROLLER.TYPE];
  if( network == Networks.TESTNET) {
    window.open(`https://jungle.bloks.io/transaction/${id}`,'_blank');
  } else if ( network == Networks.MAINNET) {
    window.open(`https://bloks.io/transaction/${id}`,'_blank');
  } else {
    // we dont have explorers for these tnx user has to check manually;
  }
  chrome.notifications.clear(id);
});


const connectToExtention = async (port,message) =>{ // to connect to the extension

  const isSelectedAccount = await checkSelectedAccount();

  if(message.allowed){
    const response = Object({status:'success',data:message.data});
    addHostToAllowedList(Host); 
    const Port = chrome.tabs.connect(tabId,{name:External_Channels.CONNECT});
    Port.postMessage(response);
  } else if(message.allowed == false){
    const response = Object({status:'error',message:message.message,code:message.code});
    const Port = chrome.tabs.connect(tabId,{name:External_Channels.CONNECT});
    Port.postMessage(response);
  }else {
    tabId = parseInt(port.sender.tab.id);
    if(await isCommunicationAllowed()){
      Host = port.sender.tab.url.split('/')[2];
      let protocol = port.sender.tab.url.split('/')[0],
          favIcon = port.sender.tab.favIconUrl;

      if(!isSelectedAccount) {
        const response = Object({status:'error',message:'No account is configured',code:Error_Codes.NO_ACCOUNT});
        const Port = chrome.tabs.connect(tabId,{name:External_Channels.CONNECT});
        Port.postMessage(response);
        return;
      }
      const error = await to(checkIfAlreadyAllowed(Host));
      if(error[0]){
        const accountsController = await get(Database_Controllers.ACCOUNT_CONTROLLER.NAME),
          account_name = accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SELECTED].split('_')[0],
          tokens = accountsController[Database_Controllers.ACCOUNT_CONTROLLER.TOKENS];
        const Port = chrome.tabs.connect(tabId,{name:External_Channels.CONNECT});
        const response = Object({status:'success',data:{account_name,tokens}});
        Port.postMessage(response);
        return;
      }
      const tempController = await get(Database_Controllers.EXTRA.NAME);
      tempController[Database_Controllers.EXTRA.TEMP_DATA] = {host:Host,protocol:protocol,favIcon:favIcon};
      const tempData = {};
      tempData[Database_Controllers.EXTRA.NAME] = tempController;
      await set(tempData);
      window.open("index.html#!/handshake", "extension_popup", "fullscreen=0,width=375,height=650,resizable=0");
    } else {
      const Port = chrome.tabs.connect(tabId,{name:External_Channels.CONNECT});
      Port.postMessage(Object({status:'error',message:'User is in Private Mode',code:Error_Codes.PRIVACY_MODE_ON}));
    }
  } 
}

const sendDappTransactions = async (port,message) =>{ // send transaction from dapp
  if(message.status == 'success'){
    const Port = chrome.tabs.connect(tabId,{name:External_Channels.SEND});
    Port.postMessage(message);
  } else if(message.status == 'error'){
    const Port = chrome.tabs.connect(tabId,{name:External_Channels.SEND});
    Port.postMessage(message);
  }else {
    tabId = parseInt(port.sender.tab.id);
    const host = port.sender.tab.url.split('/')[2],
          protocol = port.sender.tab.url.split('/')[0];
    if(await isAllowed(host)){
      const tempController = await get(Database_Controllers.EXTRA.NAME);
      tempController[Database_Controllers.EXTRA.TEMP_DATA] = {host:Host,protocol:protocol};
      const tempData = {};
      tempData[Database_Controllers.EXTRA.NAME] = tempController;
      await set(tempData);
      if(message.to){
        storeTransaction(message);
        window.open("index.html#!/sendToken/external", "extension_popup", "width=375,height=650,resizable=0");
      } else {
        const Port = chrome.tabs.connect(tabId,{name:External_Channels.SEND});
        Port.postMessage(Object({status:'error',message:'Please provide all the required parameters to push the transaction',code:Error_Codes.REQUIRED_FIELDS_ARE_MISSING}));
      }
    }else{
      const Port = chrome.tabs.connect(tabId,{name:External_Channels.SEND});
      Port.postMessage(Object({status:'error',message:'Either Private Mode is on or you are not allwed to communicate with User',code:Error_Codes.PRIVACY_MODE_ON}));
    }
  }
}

const sendCustomDappActions = async (port,message)=>{ // send custom actions from dapp
  if(message.status == 'success'){
    const Port = chrome.tabs.connect(tabId,{name:External_Channels.SEND_CUSTOM_ACTION});
    Port.postMessage(message);
  } else if(message.status == 'error'){
    const Port = chrome.tabs.connect(tabId,{name:External_Channels.SEND_CUSTOM_ACTION});
    Port.postMessage(message);
  }else {
    tabId = parseInt(port.sender.tab.id);
    const host = port.sender.tab.url.split('/')[2],
          protocol = port.sender.tab.url.split('/')[0];
    if(await isAllowed(host)){
      const tempController = await get(Database_Controllers.EXTRA.NAME);
      tempController[Database_Controllers.EXTRA.TEMP_DATA] = {host:Host,protocol:protocol};
      const tempData = {};
      tempData[Database_Controllers.EXTRA.NAME] = tempController;
      await set(tempData);
      if(message.contract && message.action && message.data){
        storeTransaction(message);
        window.open("index.html#!/sendToken/external_custom", "extension_popup", "width=375,height=650,resizable=0");
      } else {
        const Port = chrome.tabs.connect(tabId,{name:External_Channels.SEND_CUSTOM_ACTION});
        Port.postMessage(Object({status:'error',message:'Please provide all the required parameters to push the transaction',code:Error_Codes.REQUIRED_FIELDS_ARE_MISSING}));
      }
    }else{
      const Port = chrome.tabs.connect(tabId,{name:External_Channels.SEND_CUSTOM_ACTION});
      Port.postMessage(Object({status:'error',message:'Either Private Mode is on or you are not allwed to communicate with User',code:Error_Codes.PRIVACY_MODE_ON}));
    }
  }
}

   

chrome.runtime.onConnect.addListener(async (port) => { // all channel managing
  if (port.name == Channel_Names.TRANSFER_FUNDS ){ 
    port.onMessage.addListener((request)=> {
      if (request.transaction) {
        pushTransaction(JSON.parse(request.transaction)).then((response)=>{
          port.postMessage({status:'success',response:response});
        }).catch((error)=>{
          const errorObject = error.toString().split(':');
          errorObject.shift();
          port.postMessage({status:'error',error:errorObject.join(":")});
        })
      }
      else
        port.postMessage({msg: "Please send the transaction"});
    });
  } else if ( port.name == Channel_Names.GET_TRANSACTION ){
    port.onMessage.addListener((request)=> {
      if (request.transaction) {
        getTransaction(JSON.parse(request.transaction)).then((response)=>{
          port.postMessage({status:'success',response:response});
        }).catch((error)=>{
          port.postMessage({status:'error',error:error});
        })
      }
      else
        port.postMessage({msg: "Please send the Transaction ID"});
    });
  } else if(port.name == Channel_Names.SYNC_BALANCE){
    await syncBalance();
    port.postMessage('completed sync');
    getConversionRates();
    if(!IS_JOB_RUNNING){
      checkForPendingTransactions = setInterval(checkLastIrreversibleBlock,5000);
      IS_JOB_RUNNING=true;
    }
    
  } else if(port.name == Channel_Names.CURRENCY_CHECK){
    currencyCheck();

  } else if(port.name == Channel_Names.SAVE_TXN_ID){
    port.onMessage.addListener(async (message)=>{
      txn_id = message.id;
    });
  } else if(port.name == Channel_Names.GET_TXN_ID){
    port.postMessage({id:txn_id});

  } else if(port.name == Channel_Names.NETWORK_CHANGE){
    networkChanged();
    
  } else if(port.name == Channel_Names.GET_CONVERSION_RATES){
    getConversionRates();

  } else if(port.name == External_Channels.GETDATA) { // all external channels are for dapps
    const response = Object({status:'success'});
    response[Database_Controllers.NETWORK_CONTROLLER.TYPE] = networkType;
    port.postMessage(response);

  } else if(port.name == External_Channels.CONNECT) {
    port.onMessage.addListener(async (message)=>{
      connectToExtention(port,message);
    });
  }else if (port.name == External_Channels.SEND){
    port.onMessage.addListener(async (message)=>{
      sendDappTransactions(port,message);
    });
  } else if(port.name == External_Channels.SEND_CUSTOM_ACTION){
    port.onMessage.addListener(async (message)=>{
      sendCustomDappActions(port,message);
    });
}
});

chrome.runtime.onInstalled.addListener(bootstrap);
setTimeout(init,1000 * 1);
setInterval(syncBalance,1000 * 10); // per 10 secs
setInterval(getConversionRates, 1000 * 60 * 30); // per 30 mins
