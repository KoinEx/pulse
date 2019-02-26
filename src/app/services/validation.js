import {Errors,Database_Controllers} from '../constants/enums';
import to from 'await-to-js';
import { HASH } from 'crypto-js';

export default class ValidationService {

  // this is to validate

  constructor(StorageService,EosService,EncryptionService){
    this.eosService = EosService;
    this.store = StorageService;
    this.encryptionService = EncryptionService;
    this.validations ={};
  }

  async init(){
    this.accountsController = await this.store.get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
    this.selected = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SELECTED] || '';
    if(this.selected){
      this.accountName = this.selected.split('_')[0];
      this.balance = this.accountsController[this.selected][Database_Controllers.ACCOUNT_CONTROLLER.BALANCE] || 0;
    }
    this.pass = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SALT] || '';
    this.salt = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.VECTOR] || '';
    this.getAllAvailableTokens();
  }

  async validateTxn( transaction ,password){ // to validate transaction with password 
    await this.init();
    if( transaction && transaction.symbol &&  transaction.to && transaction.to != this.accountName && transaction.amount && parseFloat(transaction.amount) <= parseFloat(this.availableTokens[transaction.symbol] || 0) && !(transaction.to.search(/^[a-z,A-Z,1-5]{12}$/)) && password && HASH(password + await(this.encryptionService.decryptSalt(password,this.salt))).toString() === this.pass ) {
      let [error] = await to(this.eosService.getAccountByName({account_name:transaction.to}));
      if(error) {
        return Errors.WRONG_ACCOUNT_NAME;
      } else{
        return true;
      }
    } else if(!transaction) {
      return Errors.MISSING_FIELDS;
    } else if(!password) {
      return Errors.PASSWORD_MISSING;
    }else if(HASH(password + await(this.encryptionService.decryptSalt(password,this.salt))).toString() !== this.pass) {
      return Errors.PASSWORD_MISMATCH;
    }else if (!transaction.to) {
      return Errors.MISSING_NAME;
    } else if (!transaction.amount) {
      return Errors.MiSSING_AMOUNT;
    } else if (transaction.to == this.accountName) {
      return Errors.SAME_FROM_AND_TO;
    } else if (parseFloat(transaction.amount) > parseFloat(this.availableTokens[transaction.symbol] || 0)) {
      return Errors.INSUFFICIENT_FUNDS;
    } else {
      return Errors.WRONG_ACCOUNT_NAME;
    }
  }


  async partialValidateTxn( transaction){ // to validate transaction without password 
    await this.init();
    if( transaction && transaction.symbol &&  transaction.to && transaction.to != this.accountName && transaction.amount && parseFloat(transaction.amount) <= parseFloat(this.availableTokens[transaction.symbol] || 0) && !(transaction.to.search(/^[a-z,A-Z,1-5]{12}$/))) {
      let [error] = await to(this.eosService.getAccountByName({account_name:transaction.to}));
      if(error) {
        return Errors.WRONG_ACCOUNT_NAME;
      } else{
        return true;
      }
    }else if (!transaction) {
      return Errors.MISSING_FIELDS;
    }else if (!transaction.to) {
      return Errors.MISSING_NAME;
    }else if (!transaction.symbol) {
      return Errors.MISSING_SYMBOL;
    } else if (!transaction.amount) {
      return Errors.MiSSING_AMOUNT;
    } else if (transaction.to == this.accountName) {
      return Errors.SAME_FROM_AND_TO;
    } else if (parseFloat(transaction.amount) > parseFloat(this.availableTokens[transaction.symbol] || 0)) {
      return Errors.INSUFFICIENT_FUNDS;
    } else {
      return Errors.WRONG_ACCOUNT_NAME;
    }
  }

  async validatePartialDelicateTxn(transaction){ // to validate delegate/undelegate CPU transaction without password 
    await this.init();
    if( transaction && transaction.symbol &&  transaction.receiver && parseFloat(transaction.net_quantity) > 0 && parseFloat(transaction.CPU_quantity) > 0 && ( transaction.type == "undelegate" || ( ( transaction.type == 'delegate' && parseFloat(transaction.CPU_quantity) + parseFloat(transaction.net_quantity)) <= parseFloat(this.availableTokens[transaction.symbol] || 0))) ) {
      console.log('ho gya pass');  
      return true;
    } else if (!transaction) {
      return Errors.MISSING_FIELDS;
    } else if (!transaction.CPU_quantity) {
      return Errors.MISSING_CPU_QUNATITY;
    } else if (!transaction.net_quantity) {
      return Errors.MISSING_NET_QUNATITY;
    } else if ((parseFloat(transaction.CPU_quantity) + parseFloat(transaction.net_quantity)) > parseFloat(this.availableTokens[transaction.symbol] || 0)) {
      return Errors.INSUFFICIENT_FUNDS;
    } else {
      return Errors.WRONG_ACCOUNT_NAME;
    }
  }

  async validateDelicateTxn(transaction,password){ // to validate delegate/undelegate CPU transaction with password 
    await this.init();
    if( transaction && transaction.symbol &&  transaction.receiver && parseFloat(transaction.net_quantity) > 0 && parseFloat(transaction.CPU_quantity) > 0 && ( transaction.type == "undelegate" || ( (parseFloat(transaction.CPU_quantity) + parseFloat(transaction.net_quantity)) <= parseFloat(this.availableTokens[transaction.symbol] || 0))) && password && HASH(password + await(this.encryptionService.decryptSalt(password,this.salt))).toString() === this.pass) {
      console.log('ho gya pass');  
      return true;
    }else if(!transaction) {
      return Errors.MISSING_FIELDS;
    }else if(!password) {
      return Errors.PASSWORD_MISSING;
    }else if(HASH(password + await(this.encryptionService.decryptSalt(password,this.salt))).toString() !== this.pass) {
      return Errors.PASSWORD_MISMATCH;
    } else if (!transaction.net_quantity) {
      return Errors.MISSING_NET_QUNATITY;
    } else if (!transaction.CPU_quantity) {
      return Errors.MISSING_CPU_QUNATITY;
    } else if ((parseFloat(transaction.CPU_quantity) + parseFloat(transaction.net_quantity)) > parseFloat(this.availableTokens[transaction.symbol] || 0)) {
      return Errors.INSUFFICIENT_FUNDS;
    } else {
      return Errors.WRONG_ACCOUNT_NAME;
    }
  }

  async getAllAvailableTokens(){ // to create a map of all tokens available to the selected account
    this.availableTokens = {};
    let currency_balances = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.TOKENS] || [];
    currency_balances.map((currency)=>{
      this.availableTokens[currency.split(' ')[1]] = currency.split(' ')[0];
    });
  }


  
  async validateCustomAction(transaction,password){ // to validate the custom dapp actions
    await this.init();
    if(password && HASH(password + await(this.encryptionService.decryptSalt(password,this.salt))).toString() == this.pass && transaction.contract && transaction.action){
      return true;
    }else if(!transaction) {
      return Errors.MISSING_FIELDS;
    }else if(!password) {
      return Errors.PASSWORD_MISSING;
    }else if(HASH(password + await(this.encryptionService.decryptSalt(password,this.salt))).toString() !== this.pass) {
      return Errors.PASSWORD_MISMATCH;
    } else if (!transaction.contract) {
      return Errors.MISSING_CONTRACT;
    } else if (!transaction.action) {
      return Errors.MISSING_ACTION;
    }
  }

  validatePassword(password){ // to validate the password strength
    this.validations = {
      length:true,
      lowercase:true,
      uppercase:true,
      digit:true,
      specialCharacter:true
    }
    
    if(!(password.search(/^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/))){
      return true;
    } 

    if(password.length < 8){
      this.validations.length = false;
    }
    if(password.search(/^.*[a-z]{1,}.*$/)){
      this.validations.lowercase = false;
    } 
    if(password.search(/^.*[A-Z]{1,}.*$/)){
      this.validations.uppercase = false;
    } 
    if(password.search(/^.*[0-9]{1,}.*$/)){
      this.validations.digit = false;
    } 
    if(password.search(/^.*[!@#$%^&*]{1,}.*$/)) {
      this.validations.specialCharacter = false;
    }
    return this.validations;
  }
}

ValidationService.$inject = ['StorageService','EosService','EncryptionService']