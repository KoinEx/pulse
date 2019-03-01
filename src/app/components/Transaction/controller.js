import to from 'await-to-js';
import { Transaction_Status,Database_Controllers,External_Channels,Error_Codes } from '../../constants/enums';
// import { HASH } from 'crypto-js';

export default class TransactionController {
  
  constructor($state,StorageService,EosService,ValidationService,$scope){
    this.store = StorageService;
    this.eosService = EosService;
    this.scope = $scope;
    this.state = $state;
    this.password = '';
    this.connect = chrome.runtime.connect;
    this.copyText = "Click to copy";
    this.accountsController = {};
    this.transactionController = {};
    this.selectedTab = 'all';
    this.error = '';
    this.availableTokens={}
    this.transactionHistory=[];
    this.ladda = false;
    this.reciepent='';
    this.accountName='';
    this.typePassword = true;
    this.dropdownToken = false;
    this.dropdownReceipent = false;
    this.validationService = ValidationService;
  }

  async init() {
    this.accountsController = await this.store.get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
    const networkController = await this.store.get(Database_Controllers.NETWORK_CONTROLLER.NAME);
    this.transactionController = await this.store.getTransactions() || {};
    const tempController = await this.store.get(Database_Controllers.EXTRA.NAME) || {};
    this.selected = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SELECTED] || '';
    this.pass = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SALT] || '';
    this.salt = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.VECTOR] || '';

    if(this.selected){
      this.tokenList = this.accountsController[this.selected][Database_Controllers.ACCOUNT_CONTROLLER.CUSTOM_TOKENS] || [];
      this.accountName = this.selected.split('_')[0];
      this.balance = this.accountsController[this.selected][Database_Controllers.ACCOUNT_CONTROLLER.BALANCE] || 0;
    }
    this.currentNetwork = networkController[Database_Controllers.NETWORK_CONTROLLER.TYPE];
    this.transactionHistory = this.transactionController[Database_Controllers.TRANSACTION_CONTROLLER.HISTORY] || [];
    this.transaction =  this.transactionController[Database_Controllers.TRANSACTION_CONTROLLER.TRANSACTION] || {};
    this.transaction.symbol =  this.transaction.symbol || this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.DEFAULT_TOKEN];
    this.showTransfer =  this.transaction.type ? true : false;
    if(tempController[Database_Controllers.EXTRA.TEMP_DATA]){
      this.host = tempController[Database_Controllers.EXTRA.TEMP_DATA].host ;
      this.protocol = tempController[Database_Controllers.EXTRA.TEMP_DATA].protocol ;
    }
    tempController[Database_Controllers.EXTRA.TEMP_DATA]={};
    const tempData = {};
    tempData[Database_Controllers.EXTRA.NAME] = tempController;
    this.reciepents = this.getReciepents();
    await this.store.set(tempData);
    await this.getAllAvailableTokens();
    this.scope.$apply();
  }


  getReciepents(){ // to create the array of Recipients
    const allUniqueReciepents = {};
    this.transactionHistory.map((transaction)=>{
      if(transaction.network == this.currentNetwork && transaction.status == Transaction_Status.COMPLETED && transaction.data.to){
        allUniqueReciepents[transaction.data.to] = true;
      }
    });
    return Object.keys(allUniqueReciepents);
  }

  decimalPrecision(){ // to check for decimal precision
    const decimalPrecision = this.tokenList[this.transaction.symbol] ? this.tokenList[this.transaction.symbol].decimalPrecision : 4;
    this.transaction.amount = Math.floor(this.transaction.amount * Math.pow(10,decimalPrecision)) / Math.pow(10,decimalPrecision);
  }

  async getAllAvailableTokens(){ // to get all tokens of selected account
    this.availableTokens = {};
    let currency_balances = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.TOKENS] || [];
    currency_balances.map((currency)=>{
      this.availableTokens[currency.split(' ')[1]] = currency.split(' ')[0];
    });
  }

  async removeError(){
    this.error = '';
  }

  success(){
    this.copyText = "Copied!";
    setTimeout(()=>{
      this.copyText = "Click to copy";
      this.scope.$apply();
    },2000).bind(this);
  }

  async gotoDashboard(){
    await this.store.setState('dashboard');
    if(this.transactionController){
      this.storeTempTransaction({});
    }
    this.state.go('dashboard');
  }

  remove_(data){
    return data.replace(/_/g,' ');
  }

 async  goToSendPage(){
   if(this.transaction.type){
    this.store.setState('cpuInfo');
    this.state.go('cpuInfo');
   } else{
    this.store.setState('sendToken');
    this.state.go('sendToken');
   }
  } 

  async saveTransaction(transaction){ // save the transaction to the chrome storage after success
    let transactions = this.transactionController[Database_Controllers.TRANSACTION_CONTROLLER.HISTORY] || [];
    let pendingTransactions = this.transactionController[Database_Controllers.TRANSACTION_CONTROLLER.PENDING] || [];
    pendingTransactions.push(transactions.length);
    transactions.push({id:transaction.transaction_id,action:transaction.processed.action_traces[0].act.name,data:transaction.processed.action_traces[0].act.data,blockNumber:transaction.processed.block_num,status:Transaction_Status.PENDING,submitted_at:Date.now(),network:this.currentNetwork});
    this.transactionController[Database_Controllers.TRANSACTION_CONTROLLER.HISTORY] = transactions;
    this.transactionController[Database_Controllers.TRANSACTION_CONTROLLER.PENDING] = pendingTransactions;
    const transactionController = {};
    transactionController[Database_Controllers.TRANSACTION_CONTROLLER.NAME] = this.transactionController;
    this.store.setTransaction(transactionController);
  }

  async saveFailedTransactions(error,transaction){ // save the transaction to the chrome storage after failure
    const errorObject = error,
          reason = errorObject.error.details[0].message.split(':')[1] || errorObject.error.details[0].message;
    transaction.quantity = transaction.amount ? transaction.amount.toString() + " " + transaction.symbol.toString() : undefined;
    let transactions = this.transactionController[Database_Controllers.TRANSACTION_CONTROLLER.HISTORY] || [];
    transactions.push({action:(transaction.type || 'transfer'),data:transaction,status:Transaction_Status.FAILED,submitted_at:Date.now(),network:this.currentNetwork,reason:reason});
    this.transactionController[Database_Controllers.TRANSACTION_CONTROLLER.HISTORY] = transactions;
    const transactionController = {};
    this.transaction.status = Transaction_Status.FAILED;
    this.transaction.reason = reason;
    transactionController[Database_Controllers.TRANSACTION_CONTROLLER.NAME] = this.transactionController;
    this.store.setTransaction(transactionController);
  }

  async transfer(){ // transfer of any token through extension
    this.ladda =  true;
    const validationResponse = await this.validationService.validateTxn(this.transaction,this.password);
    if(validationResponse == true){
      const contract =  this.tokenList[this.transaction.symbol] ? this.tokenList[this.transaction.symbol].contract : 'eosio.token';
      const decimalPrecision = this.tokenList[this.transaction.symbol] ? this.tokenList[this.transaction.symbol].decimalPrecision : 4;
      await this.store.setState('transactionStatus');
      const [error,result] = await to(this.eosService.transfer_amount(contract,this.accountName,this.password,decimalPrecision,this.transaction));
      if( error ) {
        this.ladda = false;
        this.saveFailedTransactions(error,this.transaction);
        this.gotoStatusPage();
      } else {
        this.ladda=false;
        this.saveTransaction(result);
        this.gotoStatusPage();
      }
    }else {
      this.ladda = false;
      this.error = validationResponse;
      this.scope.$apply();
      await this.removeError();
      return;
    }
  }

  async sendNonTransferTransaction(){ // submit delegagte/undelegate txns from eos
    this.ladda = true;
    const validationResponse = await this.validationService.validateDelicateTxn(this.transaction,this.password);
    if(validationResponse == true ){
      const decimalPrecision = this.tokenList[this.transaction.symbol] ? this.tokenList[this.transaction.symbol].decimalPrecision : 4;
      await this.store.setState('transactionStatus');
      let [error,result] = ['',''];
      if(this.transaction.type == 'delegate'){
        [error,result] = await to(this.eosService.delegate(this.password,decimalPrecision,this.transaction));
      } else {
        [error,result] = await to(this.eosService.undelegate(this.password,decimalPrecision,this.transaction));
      }
      if( error ) {
        this.ladda = false;
        console.log(error);
        this.saveFailedTransactions(error,this.transaction);
        this.gotoStatusPage();
      } else {
        this.ladda=false;
        this.saveTransaction(result);
        this.gotoStatusPage();
      }
      
    } else {
      this.ladda=false;
      this.error = validationResponse;
      this.scope.$apply();
      await this.removeError();
      return ;
    }
  }

  async storeTempTransaction(transaction){ // to store a temp txns object
    this.transactionController[Database_Controllers.TRANSACTION_CONTROLLER.TRANSACTION] = transaction;
    const transactionController = {};
    transactionController[Database_Controllers.TRANSACTION_CONTROLLER.NAME] = this.transactionController;
    await this.store.setTransaction(transactionController);
  }

  async confirmTransaction(){ // go to the confirmation page
    this.ladda = true;
    this.transaction.from = this.accountName;
    this.storeTempTransaction(this.transaction);
    const validationResponse = await this.validationService.partialValidateTxn(this.transaction);
    if(validationResponse == true ){
      await this.store.setState('sendConfirmation');
      this.ladda=false;
      this.state.go('sendConfirmation');
    } else {
      this.ladda=false;
      this.error = validationResponse;
      this.scope.$apply();
      await this.removeError();
      return ;
    }
  }


  hasTokens(){ // check if user has any availabe tokens
    return Object.keys(this.availableTokens).length;
  }

  async rejectRequest(channel){ // for dapp if user rejects the txns
    await this.storeTempTransaction({});
    const port = this.connect({name:External_Channels[channel]});
    const result = {
      status:'error',
      error:'User rejected the request',
      code : Error_Codes.USER_REJECTED
    };
    port.postMessage(result);
    window.close();
  }

  async closeWindow(){ // close the window after operation dapps
    this.ladda=false;
    window.close();
  }

  async submitExternalTransaction(){ // submit transactions from the dapps
    this.ladda = true;
    const validationResponse = await this.validationService.validateTxn(this.transaction,this.password);
    if(validationResponse == true){
      const port = this.connect({name:External_Channels.SEND});
      const result = {};
      const contract =  this.tokenList[this.transaction.symbol] ? this.tokenList[this.transaction.symbol].contract : 'eosio.token';
      const decimalPrecision = this.tokenList[this.transaction.symbol] ? this.tokenList[this.transaction.symbol].decimalPrecision : 4;
      await this.store.setState('dashboard');
      const [error,response] = await to(this.eosService.transfer_amount(contract,this.accountName,this.password,decimalPrecision,this.transaction));
      if( error ) {
        result['status'] = 'error';
        result['error'] = error;
        this.saveFailedTransactions(error,this.transaction);
        this.storeTempTransaction({});
        setTimeout(this.closeWindow,1 * 1000);
      } else {
        result['status'] = 'success';
        result['data'] = response;
        this.saveTransaction(response);
        this.storeTempTransaction({});
        setTimeout(this.closeWindow,1 * 1000);
      }
      port.postMessage(result);
    }else {
      this.ladda = false;
      this.error = validationResponse;
      this.scope.$apply();
      await this.removeError();
      return;
    }
  }

  async submitCustomAction(){ // submit custom actions from the dapps
    this.ladda=true;
    const port = this.connect({name:External_Channels.SEND_CUSTOM_ACTION});
    const result = {};
    const contract =  this.transaction.contract;
    const validationResponse = await this.validationService.validateCustomAction(this.transaction,this.password);
    if(validationResponse != true){
      this.error = validationResponse;
      this.ladda=false;
      this.scope.$apply();
      await this.removeError();
      return;
    }
    const [error,response] = await to(this.eosService.customActions(contract,this.accountName,this.transaction.action,this.password,this.transaction.data));
    if( error ) {
      this.ladda = false;
      result['status'] = 'error';
      result['error'] = error;
      this.saveFailedTransactions(error,this.transaction);
      this.storeTempTransaction({});
      setTimeout(this.closeWindow,1 * 1000);
    } else {
      this.ladda=false;
      result['status'] = 'success';
      result['data'] = response;
      this.saveTransaction(response);
      this.storeTempTransaction({});
      setTimeout(this.closeWindow,1 * 1000);
    }
    port.postMessage(result);
  }

  gotoStatusPage(){
    this.state.go('transactionStatus');
  }

  async getTransactionHistory(){ // to retrive transaction history
    await this.init();
    this.transactionHistory = this.transactionController[Database_Controllers.TRANSACTION_CONTROLLER.HISTORY].sort((first,second)=> second.submitted_at - first.submitted_at );
    this.scope.$apply();
  }

  changeSelectedTab(tab){ // this is for transaction history
    if(this.selectedTab == tab) this.selectedTab = 'all';
    else this.selectedTab = tab;
  }

  async transactionStatus(){ // go to transaction status page
    this.store.setState('dashboard');
    await this.init();
    this.storeTempTransaction({});
  }

  toggleDropdownReceipent(){ 
    this.dropdownReceipent = !this.dropdownReceipent;
  }

  toggleDropdownToken(){
    this.dropdownToken = !this.dropdownToken;
  }

  selectReciepent(reciepent){
    this.transaction.to = this.reciepent = reciepent;
    this.dropdownReceipent=false;
  }

  togglePassword(){
    this.typePassword =  !this.typePassword;
  }

  selectToken(token){
    this.transaction.symbol = token;
    this.dropdownToken = false;
  }


}

TransactionController.$inject = ['$state','StorageService','EosService','ValidationService','$scope'];



