import {fees,creator} from '../../config/config';
import { Database_Controllers,Errors } from '../../constants/enums';
import { HASH } from 'crypto-js';



export default class Homecontroller {
  // this is the home/entrypoint controller 
  constructor($state,StorageService,EncryptionService,EosService,ValidationService,$scope){
    this.txnID='';
    this.store = StorageService;
    this.eosService = EosService;
    this.fees = fees;
    this.creator = creator;
    this.state = $state;
    this.scope = $scope;
    this.password ='';
    this.error='';
    this.cnpassword ='';
    this.encryptionService=EncryptionService;
    this.validationService= ValidationService;
    this.accountsController ={};
    this.extra={};
    this.typePassword = true;
    this.typeCnPassword=true;
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
    this.warning = "Choose a strong password which will consistently be required for all actions. This password is not recoverable. Please memorise or store the password in a safe place.";
    this.init();
  }

  async init() {
    if(!(await this.store.get('back')) && await this.store.get('onboarding')){ // condition for navigation to next state
      const state = await this.store.get(Database_Controllers.STATE_CONTROLLER.NAME);
      const current_state = state[Database_Controllers.STATE_CONTROLLER.CURRENT];
      if(current_state) this.state.go(current_state);
    }
    this.accountsController = await this.store.get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
    this.pass = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SALT] || '';
    this.salt = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.VECTOR] || '';
    this.scope.$apply();
  }


  verifyPassword(){ // this is to check for all password validation
    const validationResponse = this.validationService.validatePassword(this.password); // please see the validation service for more details
    if(validationResponse == true){
      Object.keys(this.validations).map((key)=>{
        this.validations[key] = true;
      });
    } else{
      this.validations = validationResponse;
    }
  } 

  getRandomSalt() {
    return (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) );
  }

  async createMasterAccount() { // to create the password 
    this.error = '';
    if(this.password && this.cnpassword && this.password === this.cnpassword) {
      const validationResponse =  this.validationService.validatePassword(this.password);
      if(validationResponse != true) {
        this.error = Errors.PASSWORD_VALIDATION;
        this.resetError();
        return ;
      }
      const salt = this.getRandomSalt();
      this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SALT] = HASH( this.password + salt ).toString();
      this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.VECTOR] = await this.encryptionService.encryptSalt(this.password,salt);
      const accountsController = {};
      accountsController[Database_Controllers.ACCOUNT_CONTROLLER.NAME] = this.accountsController;
      await this.store.set(accountsController);
      this.store.setState('register');
      this.state.go('register');
    } else if(! this.password ) {
      this.error = Errors.PASSWORD_MISSING;
    } else if (this.password !== this.cnpassword ){
      this.error = Errors.PASSWORD_MUST_SAME;
    }
    this.resetError();
  }

    async signIn(){ // signin
      this.error = "";
      if(this.password && HASH(this.password + (await this.encryptionService.decryptSalt(this.password,this.salt))).toString() === this.pass ) {
        const state = await this.store.get(Database_Controllers.STATE_CONTROLLER.NAME);
        const current_state = state[Database_Controllers.STATE_CONTROLLER.CURRENT];
        if(current_state) this.state.go(current_state);
        else this.state.go(Database_Controllers.STATE_CONTROLLER.DEFAULT);
      } else if(!this.password){
        this.error = Errors.PASSWORD_MISSING;
        this.ladda=false;
        this.resetError();
      }else {
        this.error = Errors.PASSWORD_MISMATCH;
        this.ladda=false;
        this.scope.$apply();
        this.resetError();
      }
    }

    async recoverAccount() { // navigate to the recover account page
      this.store.setState('recoverAccount');
      this.state.go('recoverAccount');
    }

    resetError(){ // to reset the error when user presses any thing
      setTimeout(()=>{
        this.error = '';
      },2000)
    }

    togglePassword(){  
      this.typePassword =  !this.typePassword;
    }

    toggleCnPassword(){
      this.typeCnPassword = !this.typeCnPassword;
    }
}

Homecontroller.$inject = ['$state','StorageService','EncryptionService','EosService','ValidationService','$scope'];



