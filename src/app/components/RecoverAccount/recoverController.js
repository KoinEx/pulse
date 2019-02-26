import { HASH } from 'crypto-js';
import { Channel_Names,Database_Controllers,Errors,Networks } from '../../constants/enums';
import to from 'await-to-js';
export default class RecoverController {
  
  constructor(EosService,StorageService,EncryptionService,ValidationService,$state,$scope){
    this.store = StorageService;
    this.account_name='';
    this.key='';
    this.cnpassword='';
    this.password = '';
    this.state = $state;
    this.scope = $scope;
    this.eosService = EosService;
    this.error ='';
    this.validationService = ValidationService;
    this.encryptionService = EncryptionService;
    this.accountsController ={};
    this.typePassword = true;
    this.typeCnPassword = true;
    this.ladda = false; 
    this.dropdown = false;
    this.networks =  Networks;
    this.validations = {
      length:false,
      lowercase:false,
      uppercase:false,
      digit:false,
      specialCharacter:false
    }
    this.validationText = {
      length:'8 or more characters long',
      lowercase:'At least 1 lowercase character',
      uppercase:'At least 1 UPPERCASE character',
      digit:'At least 1 number',
      specialCharacter:'At least 1 special character'
    }
    this.warning = "Password is not recoverable and you will lose your funds without them. Please write them down and store them in a safe place";      
  }
  
  async init() {
    this.accountsController = await this.store.get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
    this.networkController = await this.store.get(Database_Controllers.NETWORK_CONTROLLER.NAME);
    this.store.set({onboarding:true});
    this.onboarding = true;
    this.firstPage = true;
    this.currentNetwork = this.networkController[Database_Controllers.NETWORK_CONTROLLER.TYPE];
    this.scope.$apply();
  }

  // To recover user account and add data to chrome storage.

  getRandomSalt() {
    return (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) );
  }

  verifyPassword(){
    const validationResponse = this.validationService.validatePassword(this.password);
    if(validationResponse == true){
      Object.keys(this.validations).map((key)=>{
        this.validations[key] = true;
      });
    } else{
      this.validations = validationResponse;
    }
  } 

  async recoverAccount(){
    this.error='';
    if (this.account_name && this.password && this.password === this.cnpassword && this.key && !(this.account_name.search(/^[a-z,1-5]{12}$/))) {
      
      const validationResponse = this.validationService.validatePassword(this.password); // validate password
      if(validationResponse != true){
        this.error = Errors.PASSWORD_VALIDATION;
        this.resetError();
        return ;
      }

      let [error,userdata] = await to(this.eosService.getAccountByName({account_name:this.account_name})); // checking if account present on blockchain
      let active = await this.eosService.privateToPublic(this.key); // getting the public key from private key

      if(error){
        this.error =  Errors.ACCOUNT_NOT_FOUND;
        this.resetAll();
        this.resetError();
        return;
      }

      if(userdata && userdata.permissions[0] && userdata.permissions[0].required_auth.keys[0].key === active){ // if correct private key
        this.key = await this.encryptionService.encrypt(this.password,this.key);
        const salt = this.getRandomSalt();
        this.accountsController = {};
        this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.DEFAULT_CURRENCY] = 'USD';
        this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.DEFAULT_TOKEN] = 'EOS';
        this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS] = {};
        this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS][Networks.TESTNET] = [];
        this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS][Networks.MAINNET] = [];
        this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.ACCOUNTS][Networks.LOCALNET] = [];
        this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SALT] = HASH(this.password + salt).toString();
        this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.VECTOR] = await this.encryptionService.encryptSalt(this.password,salt);
        const accountsController = {};
        accountsController[Database_Controllers.ACCOUNT_CONTROLLER.NAME] = this.accountsController; // reset the chrome storage
        await this.store.set(accountsController);
        await this.store.save({account_name:userdata.account_name,balance:userdata.core_liquid_balance ? `${userdata.core_liquid_balance.split(' ')[0]}` : 0,resources:userdata.total_resources,keyManager:this.key});
        await this.syncBalance();
        this.resetAll();
        this.state.go('dashboard');
      }else {
        this.error =  Errors.ACCOUNT_AND_KEY_MISSMATCH;
        this.resetAll();
        this.resetError();
      }
    } else if(!this.password){
      this.error = Errors.PASSWORD_MISSING;
    } else if(this.password != this.cnpassword){
      this.error = Errors.PASSWORD_MUST_SAME;
    } else if(this.account_name.search(/^[a-z,1-5]{12}$/)){
      this.error = Errors.ACCOUNT_VALIDATION_ERROR;
    } else {
      this.error = Errors.MISSING_FIELDS;
    }
    this.resetError();
  }

  syncBalance(){ // sync balance of the current user
    return new Promise((resolve,reject)=>{
      const port = chrome.runtime.connect({name: Channel_Names.SYNC_BALANCE});
      port.postMessage({message:`Sync balance of current user`});
      port.onMessage.addListener((message)=>{resolve(true)});
    });
  }

  async gotoSecondPage(){ //  to go to the create password page
    this.error='';
    this.ladda = true;
    if(!this.key || !this.account_name ){
      this.error = Errors.MISSING_FIELDS;
      this.ladda = false;
      return;
    }
    const [error,userdata] = await to(this.eosService.getAccountByName({account_name:this.account_name}));
    const isValidPrivateKey = this.eosService.isvalidPrivateKey(this.key);
    if( error){
      this.error = Errors.ACCOUNT_NOT_FOUND;
      this.ladda = false;
      this.scope.$apply();
      this.resetError();
      return ;
    } else if( isValidPrivateKey != true ) {
      this.error = Errors.PRIVATE_KEY_ERROR;
      this.ladda = false;
      this.scope.$apply();
      this.resetError();
      return ;
    } else {
      let active = await this.eosService.privateToPublic(this.key);
      if(userdata && userdata.permissions[0] && userdata.permissions[0].required_auth.keys[0].key !== active){
        this.error =  Errors.ACCOUNT_AND_KEY_MISSMATCH;
        this.ladda=false;
        this.resetAll();
        this.resetError();
        return ;
      }
      this.ladda=false;
      this.firstPage = false;
      this.scope.$apply();
    }
  }

  gotoFirstPage(){ // go to account and key page
    this.password='';
    this.cnpassword='';
    this.key = '';
    this.firstPage=true;
  }

  toggleDropdown(){
    this.dropdown = !this.dropdown;
  }

  togglePassword(){
    this.typePassword = !this.typePassword;
  }

  toggleCnPassword(){
    this.typeCnPassword = !this.typeCnPassword;
  }

  async changeNetwork(value){ // detect network change
    this.dropdown=false;
    this.balance='';
    this.fiatValue = '';
    this.selectedTabData={};
    this.currentNetwork = this.networkController[Database_Controllers.NETWORK_CONTROLLER.TYPE] = value;
    const networkData = {};
    networkData[Database_Controllers.NETWORK_CONTROLLER.NAME] = this.networkController;
    await this.store.set(networkData);
    this.scope.$apply();
    const port = chrome.runtime.connect({name:Channel_Names.NETWORK_CHANGE});
    port.postMessage('updated network');
  }
  
  goBack(){ // for back navigation
    if(this.firstPage){
      this.store.set({back:true});
      this.store.delete('onboarding');
      this.store.setState('dashboard');
      this.state.go('home');
      return ;
    }
    this.password = '';
    this.cnpassword='';
    this.key='';
    this.account_name='';
    this.firstPage = true;
  }
  
  resetError(){
    setTimeout(()=>{
      this.error = '';
    },1000)
  }

  resetAll(){
    this.password = '';
    this.cnpassword='';
    this.key='';
    this.account_name='';
    this.firstPage = true;
    this.scope.$apply();
  }

}

RecoverController.$inject = ['EosService','StorageService','EncryptionService','ValidationService','$state','$scope'];
