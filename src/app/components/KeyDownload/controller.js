import { Database_Controllers,Errors } from '../../constants/enums';
import {HASH} from'crypto-js';

export default class KeyDownloadController {

  constructor(StorageService,$state,$scope,EncryptionService){
    this.store = StorageService;
    this.key='';
    this.password = '';
    this.state = $state;
    this.scope = $scope;
    this.error ='';
    this.keyDownloaded=false;
    this.encryptionService = EncryptionService;
    this.accountsController={};
    this.stateController = {};
    this.typePassword=true;
    this.ladda = false;
    this.init();
  }


  async init() {    
    this.accountsController = await this.store.get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
    this.pass = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SALT];
    this.salt = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.VECTOR] || '';
    this.scope.$apply();
  }

  async goToKeyDownload(){ // this to navigate to export private key on onboarding
    this.stateController = await this.store.get(Database_Controllers.STATE_CONTROLLER.NAME);
    this.store.setState('keyDownload',this.stateController[Database_Controllers.STATE_CONTROLLER.REDIRECT_TO]);
    this.state.go('keyDownload');
  }

  async goToNextPage(){ // go to the redirect page
    this.stateController = await this.store.get(Database_Controllers.STATE_CONTROLLER.NAME);
    let next_state = this.stateController[Database_Controllers.STATE_CONTROLLER.REDIRECT_TO];
    this.store.setState(next_state);
    this.state.go(next_state);
  }
  
  async success(){ // when a key is downloaded successfull naviagte to the redirect page
    this.ladda = true;
    if(HASH(this.password + (await this.encryptionService.decryptSalt(this.password,this.salt))).toString()!==this.pass) {
      this.error= Errors.PASSWORD_MISMATCH;
      this.ladda = false;
      this.scope.$apply();
    } else {
      this.password='';
      this.accountName='';
      this.privateKeyArray=[];
      this.keyDownloaded = true;
      this.ladda = false;
      this.goToNextPage();
    }
  }

  async exportKey(){ // to export the private key
    if(HASH(this.password + (await this.encryptionService.decryptSalt(this.password,this.salt))).toString()!==this.pass) {
      this.error= Errors.PASSWORD_MISMATCH;
      this.scope.$apply();
    } else {
      this.password='';
      this.accountName='';
      this.privateKeyArray=[];
      this.keyDownloaded = true;
      this.goToNextPage();
    }
  }
  
  fail(err){ // some failure during the export
   this.error=Errors.RETRY;
  }

  async keyDownload(){ // to check for password if correct change the button (for more deatils check keydownload.html)
    this.ladda = false;
    this.error = '';
    if(!this.password){
      this.error= Errors.PASSWORD_MISSING;
      this.privateKeyArray=[];
    } else if(HASH(this.password + (await this.encryptionService.decryptSalt(this.password,this.salt))).toString()!==this.pass) {
      this.error = "";
      this.privateKeyArray=[];
      this.scope.$apply();
    } else {
      this.ladda = true;
      this.error = "";
      const selected = this.accountsController[Database_Controllers.ACCOUNT_CONTROLLER.SELECTED];
      let result = this.accountsController[selected];
      this.accountName = result.account_name;
      const key = await this.encryptionService.decrypt(this.password,result.keyManager);
      this.privateKeyArray = [{accout_name:this.accountName,private_key:key}];
      this.ladda = false;
      this.scope.$apply();
    }
  }

  togglePassword(){
    this.typePassword =  !this.typePassword;
  }
}

KeyDownloadController.$inject = ['StorageService','$state','$scope','EncryptionService'];
