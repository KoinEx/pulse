import angular from 'angular';
import router from 'angular-ui-router'; 
import HomeController from './components/Home/Controller';
import TransactionController from './components/Transaction/controller';
import AccountController from './components/Registration/controller';
import AccountService from './services/account';
import DashboardController from './components/Dashboard/dashboardController';
import RecoverController from './components/RecoverAccount/recoverController';
import keyDownloadController from './components/KeyDownload/controller';
import NoticeController from './components/Notices/controller';
import CommunicationController from './components/Communication/controller';
import CustomController from './components/Extra/controller';
import storage from './services/storage';
import EosService from './services/EosServices';
import EncryptionService from './services/encryption';
import ValidationService from './services/validation';
import qrcode from 'qrcode-generator';
import ngQrcode from 'angular-qrcode';
import 'angular-clipboard';
import 'ng-csv';
import 'angular-sanitize';
import 'ngletteravatar';

window.qrcode = qrcode;
const eosWallet = angular.module('eosWallet', [router,'angular-clipboard','ngSanitize','ngCsv',ngQrcode,'ngLetterAvatar'])
                        .controller('HomeController',HomeController)
                        .controller('AccountController',AccountController)
                        .controller('TransactionController',TransactionController)
                        .controller('DashboardController',DashboardController)
                        .controller('RecoverController',RecoverController)
                        .controller('keyDownloadController',keyDownloadController)
                        .controller('CommunicationController',CommunicationController)
                        .controller('NoticeController',NoticeController)
                        .controller('CustomController',CustomController)
                        .service('AccountService',AccountService)
                        .service('EosService',EosService)
                        .service('EncryptionService',EncryptionService)
                        .service('ValidationService',ValidationService)
                        .service('StorageService',storage);


eosWallet.config(($stateProvider,$urlRouterProvider,$compileProvider) =>{
    $urlRouterProvider.otherwise("/");
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob|chrome-extension):|data:image\/)/);
    $stateProvider
    .state('home',{
        url:'/',
        templateUrl:'app/components/home/home.html',
        controller:'HomeController',
        controllerAs:'vm'
      })
    .state('register',{
        url:'/register',
        templateUrl:'app/components/Registration/registration.html',
        controller:'AccountController',
        controllerAs:'vm'
      })
    .state('registerMainnet',{
        url:'/register/mainnet',
        templateUrl:'app/components/Registration/fees.html',
        controller:'AccountController',
        controllerAs:'vm'
      })
    .state('dashboard',{
        url:'/dashboard',
        templateUrl:'app/components/Dashboard/dashboard.html',
        controller:'DashboardController',
        controllerAs:'vm'
      })
    .state('recoverAccount',{
        url:'/recoverAccount',
        templateUrl:'app/components/RecoverAccount/recover.html',
        controller:'RecoverController',
        controllerAs:'vm'
      })
    .state('receiveToken',{
        url:'/receiveToken',
        templateUrl:'app/components/Transaction/receive.html',
        controller:'TransactionController',
        controllerAs:'vm'
      })
    .state('sendToken',{
        url:'/sendToken',
        templateUrl:'app/components/Transaction/send.html',
        controller:'TransactionController',
        controllerAs:'vm'
      })
    .state('sendConfirmation',{
        url:'/sendToken/confirmation',
        templateUrl:'app/components/Transaction/send_confirmation.html',
        controller:'TransactionController',
        controllerAs:'vm'
      })
    .state('keyDownload',{
        url:'/keyDownload',
        templateUrl:'app/components/KeyDownload/keydownload.html',
        controller:'keyDownloadController',
        controllerAs:'vm'
      })
    .state('handshake',{
        url:'/handshake',
        templateUrl:'app/components/Communication/show.html',
        controller:'CommunicationController',
        controllerAs:'vm'
      })
    .state('externalSend',{
        url:'/sendToken/external',
        templateUrl:'app/components/Communication/send_confirmation.html',
        controller:'TransactionController',
        controllerAs:'vm'
      })
    .state('externalCustomSend',{
        url:'/sendToken/external_custom',
        templateUrl:'app/components/Communication/custom_actions.html',
        controller:'TransactionController',
        controllerAs:'vm'
      })
    .state('exportKey',{
        url:'/exportkey',
        templateUrl:'app/components/KeyDownload/exportkey.html',
        controller:'keyDownloadController',
        controllerAs:'vm'
      })
    .state('transactionStatus',{
        url:'/sendToken/status',
        templateUrl:'app/components/Transaction/transaction_status.html',
        controller:'TransactionController',
        controllerAs:'vm'
      })
    .state('showTransactionHistory',{
        url:'/transaction_history',
        templateUrl:'app/components/Transaction/show_history.html',
        controller:'TransactionController',
        controllerAs:'vm'
      })
    .state('welcome',{
        url:'/welcome',
        templateUrl:'app/components/Notices/welcome.html',
        controller:'NoticeController',
        controllerAs:'vm'
      })
    .state('termsAndConditions',{
        url:'/termsAndConditions',
        templateUrl:'app/components/Notices/terms_and_conditions.html',
        controller:'NoticeController',
        controllerAs:'vm'
      })
    .state('privacyPolicy',{
        url:'/privacyPolicy',
        templateUrl:'app/components/Notices/privacy_policy.html',
        controller:'NoticeController',
        controllerAs:'vm'
      })
    .state('phishingPolicy',{
        url:'/phishingPolicy',
        templateUrl:'app/components/Notices/phishing_policy.html',
        controller:'NoticeController',
        controllerAs:'vm'
      })
    .state('letsGetStarted',{
        url:'/letsGetStarted',
        templateUrl:'app/components/Notices/lets_get_started.html',
        controller:'NoticeController',
        controllerAs:'vm'
      })
    .state('whyRecover',{
        url:'/whyRecover',
        templateUrl:'app/components/KeyDownload/show.html',
        controller:'keyDownloadController',
        controllerAs:'vm'
    })
    .state('infoAndHelp',{
        url:'/infoAndHelp',
        templateUrl:'app/components/Extra/info_and_help.html',
        controller:'CustomController',
        controllerAs:'vm'
      })
    .state('privacyMode',{
        url:'/privacyMode',
        templateUrl:'app/components/Dashboard/private_mode.html',
        controller:'DashboardController',
        controllerAs:'vm'
      })
    .state('customNetwork',{
      url:'/customNetwork',
      templateUrl:'app/components/Extra/customNetwork.html',
      controller:'CustomController',
      controllerAs:'vm'
    })
    .state('customToken',{
      url:'/customToken',
      templateUrl:'app/components/Extra/customToken.html',
      controller:'CustomController',
      controllerAs:'vm'
    })
    .state('cpuInfo',{
      url:'/cpuInfo',
      templateUrl:'app/components/Extra/cpu.html',
      controller:'CustomController',
      controllerAs:'vm'
    });
});




