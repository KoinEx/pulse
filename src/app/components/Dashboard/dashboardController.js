import {  Database_Controllers,Channel_Names,Networks,Conversion_Rates } from '../../constants/enums';
import { config } from '../../config/config';

export default class DashboardController {
  // dashboard controller
  constructor(StorageService,AccountService,EosService,$scope,$state,$rootScope){
    this.store = StorageService;
    this.accountService = AccountService;
    this.eosService = EosService;
    this.scope = $scope;
    this.loader= false;
    this.menuOpened = false;
    this.settingsOpened = false;
    this.hello=false;
    this.dropdown=false;
    this.currency_balances = [];
    this.balance ='';
    this.fiatValue = '';
    this.showCurrencyOption = false;
    this.state =$state;
    this.allBlur = false;
    this.symbol=undefined;
    this.tabs = ['token','txnHistory'];
    this.defaultCurrencies = ['USD','BTC','INR','EUR','GBP']; 
    this.selectedTab = 0;
    this.selected = ' ';
    this.root = $rootScope;
    this.selectedTabData = [];
    this.transactionHistory = [];
    this.accountsController={};
    this.transactionsController = {};
    this.networks = Networks;
    this.defaultCurrency = ''; 
    this.math = Math;
    this.parseFloat = parseFloat;
    this.copyText = "Click to copy";
    this.syncBalanceController = '';
    this.syncBalanceIsRunning = false;
    this.fees = config[Networks.MAINNET].fees;
  }


  async init () {
    this.networkController = await this.store.get(Database_Controllers.NETWORK_CONTROLLER.NAME);
    this.currentNetwork = this.networkController[Database_Controllers.NETWORK_CONTROLLER.TYPE];
    this.communicationController = await this.store.get(Database_Controllers.COMMUCATION_CONTROLLER.NAME);
    this.accountsController = await this.store.get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
    this.accounts = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS][this.currentNetwork];
    this.selected = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SELECTED] || '';
    const customNetworks = this.networkController[Database_Controllers.NETWORK_CONTROLLER.CUSTOM_NETWORKS];
    if ( customNetworks ){
      Object.keys(customNetworks).map((network)=>{
        if(network){ this.networks[network.toUpperCase()] = network; }
      });
    }
    this.privacyMode = this.communicationController[Database_Controllers.COMMUCATION_CONTROLLER.PRIVACY_MODE] == false ? true : false;
    this.store.delete('onboarding'); 
    this.store.delete('back');
    this.store.delete('onboardingRecover');
    this.scope.$apply();
    this.syncBalance();
  }

  async generateSelectedTabData(currency_balances = null){ // to generate tha data according to the selected tab on the dashbord i.e tokens,transaction history
    if(this.selectedTab == 0 && this.selected) {
      this.selectedTabData={};
      this.accountsController = await this.store.get(Database_Controllers.ACCOUNT_CONTROLLER.NAME) || {};
      this.currency_balances = currency_balances || this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.TOKENS] || [];
      this.customTokens = this.accountsController[this.selected][Database_Controllers.ACCOUNT_CONTROLLER.CUSTOM_TOKENS] || {};
      
      this.currency_balances.map( (currency) => {
        this.selectedTabData[currency.split(' ')[1]] = currency.split(' ')[0];
      }); 
      
      Object.keys(this.customTokens).map((customToken)=>{
        if(!this.selectedTabData[customToken]) {
          this.selectedTabData[customToken] = "0.0000";
        }
      });
      return ;
    } else if(this.selected){
      this.selectedTabData = [];
      this.transactionsController = await this.store.getTransactions() || {};
      this.transactionHistory = this.transactionsController[Database_Controllers.TRANSACTION_CONTROLLER.HISTORY] || [];
      this.transactionHistory.map(({data,submitted_at,id,status,action})=>{
        this.selectedTabData.push({data,submitted_at,id,status,action});
      });
      this.selectedTabData.sort((first,second)=> second.submitted_at - first.submitted_at );
      return ;
    }
  }

  async getAccountInfo(){ // this is to poll for user balances and cpu limits
    this.accountsController = await this.store.get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
    this.defaultCurrency = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.DEFAULT_CURRENCY];
    this.defaultToken = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.DEFAULT_TOKEN];
    this.accounts = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS][this.currentNetwork];
    if(this.accounts.length){
      this.transactionsController = await this.store.getTransactions() || {};
      this.conversionController = await this.store.get(Conversion_Rates.NAME);
      this.selectedTabData={};
      this.selected = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SELECTED] || '';
      this.cpuInfo =  this.accountsController[this.selected][Database_Controllers.ACCOUNT_CONTROLLER.CPU_LIMIT];
      this.accountName = this.selected.split('_')[0];
      const userdata = this.accountsController[this.selected];
      this.balance = userdata.balance;
      this.fiatValue = this.conversionController[this.defaultToken]  ? Math.floor(this.conversionController[this.defaultToken][this.defaultCurrency] * this.balance * 10000)/10000 : '0';

      if(this.fiatValue == '0') {
        this.getConversionRates();
      }
      await this.generateSelectedTabData();
      this.scope.$apply();
    } else{
      this.allBlur = true;
    }
  }

  async syncBalance(){
    this.store.setState('dashboard'); // to set current state of the extension
    await this.getAccountInfo();

    if( !this.syncBalanceIsRunning ) {
      this.syncBalanceController = setInterval(this.getAccountInfo.bind(this),10 * 1000 + 10);
      this.syncBalanceIsRunning = true;
    } else {
      clearInterval(this.syncBalanceController);
      this.syncBalanceController = setInterval(this.getAccountInfo.bind(this),10 * 1000 + 10);
    }
  }

   async updateAccountName(){
    this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SELECTED] = this.selected;
    this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.TOKENS] = [];
    const accountsController = {};
    accountsController[Database_Controllers.ACCOUNT_CONTROLLER.NAME]= this.accountsController;
    await this.store.set(accountsController);
    this.getAccountInfo();
    this.loader= true;
    const port = chrome.runtime.connect({name: Channel_Names.SYNC_BALANCE});
    port.postMessage({message:`Check balance of current user`});
    port.onMessage.addListener(async (message)=>{await this.generateSelectedTabData();this.loader = false; this.scope.$apply();});
   }

  async selectedAccount(){  // if selected account changes 
    if(this.menuOpened){
      setTimeout( async () => {
        this.updateAccountName();
      }, 800);
      this.menuOpened = false;
    } else {
      this.updateAccountName();
    }
   
  }

  async createAccount(){ // navigate to the create account page
    console.log(this.changeNetwork);
    setTimeout(async ()=>{
      if(this.currentNetwork == Networks.MAINNET){
        this.store.setState('registerMainnet');
        this.state.go('registerMainnet');
        return;
      }
      this.store.setState('register');
      await this.store.set({is_forgotAccount:false});
      this.state.go('register');
    },800);
    this.toggleMenu();
  }
  
  async gotoState(state){ // navigate to particular state
    clearInterval(this.syncBalanceController);
    this.syncBalanceIsRunning =false;
    await this.store.setState(state);
    this.state.go(state);
  }
  
  toggleMenu(){ // toggle the side menu 
    this.menuOpened = !this.menuOpened;
    console.log('opened menu');
  }

  async showTokens(){ // to select the token tab
    this.selectedTab = 0;
    await this.generateSelectedTabData();
    this.scope.$apply();
  }

  async showTxnHistory(){ // to select the transaction history tab
    this.selectedTab=1;
    await this.generateSelectedTabData();
    this.scope.$apply();
  }

  showCurrency(){ // this is to toggle the currency dropdown
    this.showCurrencyOption = !this.showCurrencyOption;
  }

  async updateDefaultCurency( currency ){ // to update the currency
    this.showCurrencyOption = false;
    this.defaultCurrency = currency;
    this.accountsController = await this.store.get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
    this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.DEFAULT_CURRENCY] = this.defaultCurrency;
    const accountsData = {};
    accountsData[Database_Controllers.ACCOUNT_CONTROLLER.NAME] = this.accountsController;
    await this.store.set(accountsData);
    this.getAccountInfo();
  }

  async exportKey(){ // navigate to the export key page
    setTimeout(async()=>{
      clearInterval(this.syncBalanceController);
      this.syncBalanceIsRunning =false;
      await this.store.setState('exportKey','dashboard'); // second argument is where to redirect after export
      this.state.go('exportKey');
    },800);
    this.toggleMenu();
  }

  async createNewAccount(){ // this is to navigate to the create account page without animation
    clearInterval(this.syncBalanceController);
    this.syncBalanceIsRunning =false;
    if(this.currentNetwork == Networks.MAINNET){
      this.store.setState('registerMainnet');
      this.state.go('registerMainnet');
      return;
    }
    this.store.setState('register');
    await this.store.set({is_forgotAccount:false});
    this.state.go('register');
  }

  async goToNextState(state){ // go to next State with animation
    setTimeout(async ()=>{
      clearInterval(this.syncBalanceController);
      this.syncBalanceIsRunning =false;
      this.state.go(state);
    },800);
    this.toggleMenu();
  }

  async importAccount(){ // navigate to import account page with animation
    setTimeout(async ()=>{
      clearInterval(this.syncBalanceController);
      this.syncBalanceIsRunning =false;
      await this.store.set({is_forgotAccount:true});
      this.state.go('register');
    },800);
    this.toggleMenu();
  }

  async importEOSAccount(){ // navigate to import account page without animation
    clearInterval(this.syncBalanceController);
    this.syncBalanceIsRunning =false;
    await this.store.set({is_forgotAccount:true});
    this.store.setState('register');
    this.state.go('register');
  }

  async changeNetwork(value){ // this is for network change and update all configs according to that
    clearInterval(this.syncBalanceController);
    this.dropdown=false;
    this.balance='';
    this.fiatValue = '';
    this.selectedTabData={};
    this.currentNetwork = this.networkController[Database_Controllers.NETWORK_CONTROLLER.TYPE] = value;
    this.selected = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS][this.currentNetwork][0] || '';
    this.selected = this.selected ? `${this.selected}_${this.currentNetwork}` : '';
    const networkData = {};
    networkData[Database_Controllers.NETWORK_CONTROLLER.NAME] = this.networkController;
    await this.store.set(networkData);
    const port = chrome.runtime.connect({name:Channel_Names.NETWORK_CHANGE});
    port.postMessage('updated network');
    await this.selectedAccount();
    this.scope.$apply();
  }

  toggleDropdown(){ // this to toggle the network dropdown
    this.dropdown = !this.dropdown;
  }

  async togglePrivacy(){ // this is to toggle the Private mode
    this.communicationController[Database_Controllers.COMMUCATION_CONTROLLER.PRIVACY_MODE] = !this.privacyMode;
    const communicationData = {};
    communicationData[Database_Controllers.COMMUCATION_CONTROLLER.NAME]=this.communicationController;
    await this.store.set(communicationData);
  }

  success(){ // this to change the tooltip text
    this.copyText = "Copied!";
    setTimeout(()=>{
      this.copyText = "Click to copy";
      this.scope.$apply();
    },2000).bind(this);
  }

  checkIfNoData(){ // to check if no data to show
    if(this.selectedTabData.length == 0 || Object.keys(this.selectedTabData).length == 0) return true;
    return false;
  }

  gotoUrl(txn_id){ // this is to go to the block explorer
    if(this.currentNetwork == Networks.TESTNET || this.currentNetwork == Networks.MAINNET)
    {
      const network_url = this.currentNetwork == Networks.TESTNET ? 'jungle.' :'';
      this.baseUrl = `https://${network_url}bloks.io/transaction`
      if(txn_id){
        window.open(`${this.baseUrl}/${txn_id}`,'_blank');
      }
    }
  }

  getConversionRates(){ // to update currency conversion rates
    const port = chrome.runtime.connect({name:Channel_Names.GET_CONVERSION_RATES});
    port.postMessage('Get Conversion rates from the server');
  }

}



DashboardController.$inject=['StorageService','AccountService','EosService','$scope','$state','$rootScope'];