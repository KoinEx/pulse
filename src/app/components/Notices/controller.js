
export default class NoticeController{
  constructor($state,StorageService,$scope){
    this.state = $state;
    this.store = StorageService;
    this.scope=$scope;

  }

  async gotoHomePage(state){ // to show all the notices
    if(state == 'home'){
      this.store.setState(null);
    } else {
      this.store.setState(state);
    }
    this.state.go(state);
  }

}

NoticeController.$inject = ['$state','StorageService','$scope']