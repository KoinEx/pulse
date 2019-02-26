import { config } from '../../config/config';
import { HASH } from 'crypto-js';
import  Fingerprint from 'fingerprintjs';
import to from 'await-to-js';
import { Database_Controllers,Channel_Names,Errors ,Networks} from '../../constants/enums';

export default class AccountController {

  constructor(AccountService,EosService,StorageService,EncryptionService,$state,$scope){
    this.store = StorageService;
    this.txnID='';
    this.creator = config.mainnet.creator;
    this.fees = config.mainnet.fees;
    this.account_name='';
    this.key='';
    this.cnpassword='';
    this.dropdown = false;
    this.accountService = AccountService;
    this.password = '';
    this.state = $state;
    this.scope = $scope;
    this.networks = Networks;
    this.eosService = EosService;
    this.error ='';
    this.encryptionService = EncryptionService;
    this.accountController={};
    this.ladda = false;
    this.copyText = "Click to copy";
    this.accountNameValidations = {
      length:false
    };
    this.typePassword = true;
    this.warning = "The new account will be created on testnet by default. Once the account is created you will get the option to create one on the mainnet."
  }



  async init() {    
    const database = await this.store.getAll();
    this.onboarding = database['onboarding'];
    this.store.delete('back');
    this.onboardingRecover = database['onboardingRecover'] || false;
    this.accountController = database[Database_Controllers.ACCOUNT_CONTROLLER.NAME] || {}; 
    this.extraController = database[Database_Controllers.EXTRA.NAME] || {};
    this.Memo = this.extraController[Database_Controllers.EXTRA.MEMO] || this.getRandomSalt();
    this.memo = HASH(this.Memo).toString();
    this.networkController = database[Database_Controllers.NETWORK_CONTROLLER.NAME] || {};
    this.currentNetwork = this.networkController[Database_Controllers.NETWORK_CONTROLLER.TYPE] || '';
    this.pass = this.accountController[Database_Controllers.ACCOUNT_CONTROLLER.SALT] || '';
    this.salt = this.accountController[Database_Controllers.ACCOUNT_CONTROLLER.VECTOR] || '';
    this.is_forgotAccount =  database[Database_Controllers.FORGOT_PASSWORD] || false;
    if(this.onboardingRecover) {
      this.account_name = this.accountController[Database_Controllers.ACCOUNT_CONTROLLER.SELECTED].split('_')[0];
    }
    this.scope.$apply();
    this.extraController[Database_Controllers.EXTRA.MEMO] = this.Memo;
    const extra = {};
    extra[Database_Controllers.EXTRA.NAME]= this.extraController; 
    await this.store.set(extra);
  }

  getRandomSalt() {
    return (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) );
  }

  async verifyAndStoreData(){ // after storing the data go to next page
    await this.store.set({onboardingRecover:true});
    await this.store.setState('whyRecover','register');
    const extra = {};
    this.extraController[Database_Controllers.EXTRA.MEMO] = '';
    extra[Database_Controllers.EXTRA.NAME] = this.extraController;
    await this.store.set(extra);
    await this.store.set({is_forgotAccount:true});
    this.state.go('whyRecover')
  }

  verifyAccountName(){ 
    if(this.account_name.length == 12){
      this.accountNameValidations.length = true;
    } else {
      this.accountNameValidations.length = false;
    }
  }

  // To Create new Eos Account
  async createAccount(){
    this.error = '';
    this.ladda=true;
    if (this.password && this.account_name && !(this.account_name.search(/^[a-z,1-5]{12}$/)) && HASH(this.password + (await this.encryptionService.decryptSalt(this.password,this.salt))).toString() === this.pass ){
      const ERROR = await to(this.eosService.getAccountByName({account_name:this.account_name}));
      if(!ERROR){
        this.error = Errors.DUPLICATE_ACCOUNT;
        this.ladda = false;
        this.scope.$apply();
        await this.resetError();
        return;
      }
      const deviceID =  new Fingerprint({screen_resolution: true,hasher:HASH}).get().toString();
      const [error,result] = await to(this.eosService.createAccount(this.account_name,deviceID,this.Memo));
      if(error){
        this.error=error.msg;
        this.ladda = false;
        this.scope.$apply();
        await this.resetError();
      } else {
        this.ladda=false;
        await this.store.save({account_name:this.account_name,keyManager: await this.encryptionService.encrypt(this.password,result.key)});
        this.verifyAndStoreData();
      }
    } else if(!this.account_name || !this.password){
      this.error=Errors.MISSING_FIELDS;
      this.ladda = false;
    } else if(!this.accountNameValidations.length ){
      this.error=Errors.ACCOUNT_NAME_LENGTH;
      this.ladda = false;
    }else if(this.account_name.search(/^[a-z,1-5]{12}$/)){
      this.ladda = false;
      this.error = Errors.ACCOUNT_VALIDATION_ERROR;
    }else if(HASH(this.password + (await this.encryptionService.decryptSalt(this.password,this.salt))).toString() !== this.pass ) {
      this.error = Errors.PASSWORD_MISMATCH;
      this.ladda=false;
      this.scope.$apply();
    } else {
      this.error= Errors.ACCOUNT_VALIDATION_ERROR;
      this.ladda=false;
      this.scope.$apply();
    }
    this.resetError();
  }

  async verifyTxn(){ // to verify txn if network is mainnet
    this.error = '';
    this.ladda = true;
    if(this.txnID) {
      this.eosService.verifyTxn(this.txnID).then(async (txn)=>{
        if (txn.trx.trx) {
          this.data = txn.trx.trx.actions[0].data;
          if (this.data.to != this.creator ){ this.error=Errors.INCORRECT_CREATOR;}
          else if ( this.data.quantity != this.fees ){this.error=Errors.INCORRECT_AMOUNT;}
          else if ( this.data.memo != this.memo ){this.error=Errors.INCORRECT_MEMO_TAG;}
          else {
            const port = chrome.runtime.connect({name: Channel_Names.SAVE_TXN_ID});
            port.postMessage({id:this.txnID});
            this.store.setState('register');
            await this.store.set({is_forgotAccount:false});
            this.state.go('register');
          }
          this.ladda = false;
          this.scope.$apply();
        } else {
          this.error=Errors.INCORRECT_TXN_ID;
          this.ladda = false;
        }
        }).catch((error)=>{
          console.log(error);
          this.error= Errors.COMMON;
          this.ladda = false;
          this.scope.$apply();
        });
      } else {
        this.error = Errors.TRANSACTION_ID_MISSING;
        this.ladda = false;
      }
    }

  
  // To recover user account and add data to chrome storage.

  async recoverAccount(){ 
    this.ladda=true;
    this.error='';

    if ((this.key && this.onboardingRecover) || (this.account_name && this.password && this.pass == HASH(this.password + (await this.encryptionService.decryptSalt(this.password,this.salt))).toString() && this.key && !(this.account_name.search(/^[a-z,1-5]{12}$/)))) {
      let [error,userdata] = await to(this.eosService.getAccountByName({account_name:this.account_name}));
      const isValidPrivateKey = this.eosService.isvalidPrivateKey(this.key);

      if(!isValidPrivateKey) {
        this.error = Errors.PRIVATE_KEY_ERROR;
        this.resetAll();
        this.resetError();
        return ;
      }
      let active = await this.eosService.privateToPublic(this.key);

      if(error){
        this.error =  Errors.ACCOUNT_NOT_FOUND;
        this.resetAll();
        this.resetError();
        return ;
      }
      
      if(userdata && userdata.permissions[0] && userdata.permissions[0].required_auth.keys[0].key === active){
        if(!this.onboardingRecover) {
          this.key = await this.encryptionService.encrypt(this.password,this.key);
          await this.store.save({
            account_name:userdata.account_name,balance:userdata.core_liquid_balance ? `${userdata.core_liquid_balance.split(' ')[0]}` : 0,resources:userdata.total_resources,keyManager:this.key
          });
        }
        await this.syncBalance();
        this.ladda=false;
        this.resetAll();
        this.gotoDashboard();
      }else {
        this.error =  Errors.ACCOUNT_NOT_FOUND;
        this.resetAll();
        this.resetError();
      }
    }else if(this.account_name.search(/^[a-z,1-5]{12}$/)){
      this.error = Errors.ACCOUNT_VALIDATION_ERROR;
      this.ladda = false;
      this.scope.$apply();
    }else if(!this.onboardingRecover && this.pass != HASH(this.password + (await this.encryptionService.decryptSalt(this.password,this.salt))).toString() ) {
      this.error=Errors.PASSWORD_MISMATCH;
      this.ladda=false;
      this.scope.$apply();
    } else {
      this.error = Errors.MISSING_FIELDS;
      this.ladda=false;
    }
    this.resetError();
  }

  // To show recover account UI
  getRecoverUi(){
    this.is_forgotAccount = !this.is_forgotAccount;
    this.store.set({is_forgotAccount:this.is_forgotAccount});
  }

  syncBalance(){
    return new Promise((resolve,reject)=>{
      const port = chrome.runtime.connect({name: Channel_Names.SYNC_BALANCE});
      port.postMessage({message:`Sync balance of current user`});
      port.onMessage.addListener((message)=>{resolve(true)});
    });
  }

  async goBack(){
    if(this.is_forgotAccount){
      this.getRecoverUi();
      return ;
    }
    this.accountController[Database_Controllers.ACCOUNT_CONTROLLER.SALT] = '';
    const acccoutData = {};
    acccoutData[Database_Controllers.ACCOUNT_CONTROLLER.NAME] = this.accountController;
    await this.store.set(acccoutData);
    this.store.set({back:true});
    this.state.go('home');
  }

  resetAll(){
    this.password = '';
    this.key='';
    this.ladda=false;
    if(!this.onboardingRecover) {
      this.account_name='';
    }
    this.scope.$apply();
  }

  resetError(){
    setTimeout(()=>{
      this.error = '';
      this.ladda=false;
    },2000)
  }
  
  togglePassword(){
    this.typePassword =  !this.typePassword;
  }

  async changeNetwork(value){
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
  

  gotoDashboard(){
    this.state.go('dashboard');
  }

  success(){
    this.copyText = "Copied!";
    setTimeout(()=>{
      this.copyText = "Click to copy";
      this.scope.$apply();
    },2000).bind(this);
  }

  toggleDropdown(){
    this.dropdown = !this.dropdown;
  }

}

AccountController.$inject = ['AccountService','EosService','StorageService','EncryptionService','$state','$scope'];
