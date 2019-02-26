import { Database_Controllers,External_Channels,Error_Codes} from '../../constants/enums';

export default class CommunicationController {
  // this controller is fot connecting a user user to the dapps
  constructor(StorageService,$scope){
    this.store = StorageService;
    this.scope = $scope;
    this.connect = chrome.runtime.connect;
    this.port = this.connect({name:External_Channels.CONNECT});
    this.init();
  }

  async init(){
    const networkController = await this.store.get(Database_Controllers.NETWORK_CONTROLLER.NAME);
    this.currentNetwork = networkController[Database_Controllers.NETWORK_CONTROLLER.TYPE];
    const accountController = await this.store.get(Database_Controllers.ACCOUNT_CONTROLLER.NAME);
    this.accountName = accountController[Database_Controllers.ACCOUNT_CONTROLLER.SELECTED].split('_')[0];
    this.tokens = accountController[Database_Controllers.ACCOUNT_CONTROLLER.TOKENS];
    const tempController = await this.store.get(Database_Controllers.EXTRA.NAME);
    this.host = tempController[Database_Controllers.EXTRA.TEMP_DATA].host;
    this.protocol = tempController[Database_Controllers.EXTRA.TEMP_DATA].protocol;
    this.favIcon = tempController[Database_Controllers.EXTRA.TEMP_DATA].favIcon || false;
    tempController[Database_Controllers.EXTRA.TEMP_DATA]={};
    const tempData = {};
    tempData[Database_Controllers.EXTRA.NAME] = tempController;
    await this.store.set(tempData);
    this.scope.$apply();
    
  }

  allow(){
    this.port.postMessage({allowed:true,data:{account_name:this.accountName,tokens:this.tokens}});
    this.port.disconnect();
    window.close();
  }

  block(){
    this.port.postMessage({allowed:false,messase:"User rejected the request",code:Error_Codes.USER_REJECTED});
    this.port.disconnect();
    window.close();
  }
  
}

CommunicationController.$inject = ['StorageService','$scope'];
