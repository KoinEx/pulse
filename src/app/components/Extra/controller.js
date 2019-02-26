import { Database_Controllers,Networks,Errors,Channel_Names } from '../../constants/enums';
import to from 'await-to-js';
export default class CustomController {
  // custom controller for addon features netwotk,adding token, and CPU delegation and undelegation
  constructor(StorageService,EosService,ValidationService,$state,$scope){
    this.store = StorageService;
    this.customNetwork = {};
    this.state = $state;
    this.eosService = EosService;
    this.networkAttributes = ['name','host','port','protocol'];
    this.error = "";
    this.scope = $scope;
    this.networkController="";
    this.customToken = {};
    this.ladda = false;
    this.accountName = "";
    this.balance = "";
    this.validationService = ValidationService;
    this.tokenAttributes = ['contract','token','decimalPrecision'];
    this.init();
  }



  decimalPrecision(){ // to check for decimal precision
    const decimalPrecision = 4;
    this.transaction.CPU_quantity = Math.floor(this.transaction.CPU_quantity * Math.pow(10,decimalPrecision)) / Math.pow(10,decimalPrecision);
    this.transaction.net_quantity = Math.floor(this.transaction.net_quantity * Math.pow(10,decimalPrecision)) / Math.pow(10,decimalPrecision);
  }


  async init(){
    const accountsController = await this.store.get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
    this.selected = accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SELECTED];
    this.selectedOperation = 'delegate';
    if(this.selected) {
      this.accountName = this.selected.split('_')[0];
      this.cpuInfo = accountsController[this.selected][Database_Controllers.ACCOUNT_CONTROLLER.CPU_LIMIT];
      this.netInfo = accountsController[this.selected][Database_Controllers.ACCOUNT_CONTROLLER.NET_LIMIT];
      this.balance = accountsController[this.selected][Database_Controllers.ACCOUNT_CONTROLLER.BALANCE];
      this.transaction = {symbol:'EOS',from:this.accountName,receiver:this.accountName};
    }
  }

  async submitRequest(){ // this for the cpu delegation and undelegation
    this.ladda = true;
    this.transaction.type = this.selectedOperation;
    const validationResponse = await this.validationService.validatePartialDelicateTxn(this.transaction);
    if(validationResponse == true){
      this.transactionController = await this.store.getTransactions() || {};
      this.transactionController[Database_Controllers.TRANSACTION_CONTROLLER.TRANSACTION] = this.transaction;
      const transactionController = {};
      transactionController[Database_Controllers.TRANSACTION_CONTROLLER.NAME] = this.transactionController;
      await this.store.setTransaction(transactionController);
      await this.store.setState('sendConfirmation');
      this.ladda=false;
      this.state.go('sendConfirmation');
    } else {
      this.ladda = false;
      this.error = validationResponse;
      this.scope.$apply();
      return ;
    }
  }

  cpuOperation(operation){ // updating the operation type of cpu
    this.selectedOperation = operation;
  }


  async addNetwork(){ // add a custom network
    this.error = '';
    this.ladda = true;
    let allParamas = true;

    const accountsController = await this.store.get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
    const accounts = accountsController[Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS];

    if(accounts[this.customNetwork.name] ) { // checking if same network name is already present or not
      this.error = Errors.DUPLICATE_NETWORK_NAME;
      this.ladda = false;
      this.scope.$apply();
      return ;
    }

    Object.keys(Networks).map((key)=>{ // checking if same network name is already present or not in default networks
      if(this.customNetwork.name == Networks[key]){
        this.error = Errors.DUPLICATE_NETWORK_NAME;
        this.ladda = false;
        this.scope.$apply();
        return ;
      }
    });

    this.networkAttributes.forEach((attribute)=>{ // checking for all the required fields
      if(!this.customNetwork[attribute]){
        allParamas = false;
      }
    });

    const httpEndPoint = `${this.customNetwork.protocol}://${this.customNetwork.host}:${this.customNetwork.port}`;
    const [errorGettingInfo,networkInfo] = await to(this.eosService.getInfo(httpEndPoint)); // checking if node is runnig

    if(errorGettingInfo){
      this.error=Errors.WRONG_NODE_ADDRESS;
      console.log(errorGettingInfo);
      this.ladda = false;
      this.scope.$apply();
      return ;
    } else{
      console.log(networkInfo);
      this.customNetwork.chainId = networkInfo.chain_id;
    }

    if(allParamas){
      this.networkController =  await this.store.get(Database_Controllers.NETWORK_CONTROLLER.NAME);
      const customNetwork = this.networkController[Database_Controllers.NETWORK_CONTROLLER.CUSTOM_NETWORKS] || {};
      customNetwork[this.customNetwork.name] = this.customNetwork;
      this.networkController[Database_Controllers.NETWORK_CONTROLLER.CUSTOM_NETWORKS] = customNetwork;
      const networkData = {};
      networkData[Database_Controllers.NETWORK_CONTROLLER.NAME]=this.networkController;
      accountsController[Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS][this.customNetwork.name] = [];
      const accountsData = {};
      accountsData[Database_Controllers.ACCOUNT_CONTROLLER.NAME] = accountsController;
      this.store.set(networkData);
      this.store.set(accountsData);
      this.ladda = false;
      this.state.go('dashboard');
    } else{
      this.ladda = false;
      this.error = Errors.MI;
      this.scope.$apply();
    }
  }

  async addToken(){ // adding a custom token
    this.ladda= true;
    this.error = '';
    let allParamas = true;
    this.tokenAttributes.forEach((attribute)=>{ // checking for all required fields
      if(!this.customToken[attribute]){
        allParamas = false;
      }
    });

    let [error] =  await to(this.eosService.getAccountByName({account_name:this.customToken.contract}));

    if(error){
      this.error = Errors.INCORRECT_CONTRACT;
      this.ladda= false;
      this.scope.$apply();
      return;
    } 

    [error] = await to(this.eosService.getCurrencyBalance({acount:this.accountName,code:this.customToken.contract,symbol:this.customToken.token}));

    if(error){ // to check if this token is present on the blockchain or not
      this.error = Errors.TOKEN_DOESNOT_EXISTS;
      this.ladda= false;
      this.scope.$apply();
      return;
    } 

    if(allParamas){
      await this.store.setCustomToken(this.customToken);
      const port = chrome.runtime.connect({name: Channel_Names.SYNC_BALANCE});
      port.postMessage({message:`Check balance of current user`});
      port.onMessage.addListener(async (message)=>{ this.state.go('dashboard'); this.ladda= false;});
    } else{
      this.error = Errors.MISSING_FIELDS;
      this.ladda= false;
      this.scope.$apply();
    }

  }

  gotoDashboard(){
    this.state.go('dashboard');
  }


}

CustomController.$inject = ['StorageService','EosService','ValidationService','$state','$scope']