// all the contants used in the project


const Transaction_Status = Object.freeze({
  PENDING:'submitted',
  COMPLETED:'confirmed',
  FAILED:'failed'
});

const Database_Controllers =Object.freeze({
  ACCOUNT_CONTROLLER : Object.freeze({
    NAME:'AccountController',
    SELECTED:'selected',
    ACCOUNTS:'accounts',
    BALANCE:'balance',
    TOKENS:'tokens',
    SALT:'salt',
    VECTOR:'vi',
    CPU_LIMIT:'cpu_limit',
    NET_LIMIT:'net_limit',
    DEFAULT_CURRENCY:'DefaultCurrency',
    DEFAULT_TOKEN:'DefaultToken',
    CUSTOM_TOKENS:'Custom_Tokens'
  }),
  TRANSACTION_CONTROLLER : Object.freeze({
    NAME:'TransactionController',
    HISTORY:'TransactionHistory',
    PENDING:'PendingTransactions',
    TRANSACTION:'transaction'
  }),
  EXTRA:Object.freeze({
    NAME:'Extra',
    MEMO:'Memo',
    TOKEN_LIST:'TokenList',
    TEMP_DATA:'TempData'
  }),
  NETWORK_CONTROLLER:Object.freeze({
    NAME:'NetworkController',
    TYPE:'type',
    CUSTOM_NETWORKS:'CustomNetwors'
  }),
  STATE_CONTROLLER:Object.freeze({
    NAME:'StateController',
    CURRENT:'Current',
    REDIRECT_TO:'RedirectTo',
    DEFAULT:'home'
  }),
  COMMUCATION_CONTROLLER:Object.freeze({
    NAME:'CommunicationController',
    ALLOWED_HOSTS:'AllowedHosts',
    BLOCKED_HOSTS:'BlockedHosts',
    PRIVACY_MODE:'Communication'
  }),
  FORGOT_PASSWORD:'is_forgotAccount',
  POLICY_CONTROLLER : 'PolicyController',
  VERSION_CONTROLLER : 'Version'
});

const Channel_Names = Object.freeze({
  TRANSFER_FUNDS:'TransferTokens',
  SYNC_BALANCE:'SyncUserBalance',
  GET_TRANSACTION:'GetAccountTransaction',
  CURRENCY_CHECK:'CheckForUserCurrencyBalance',
  NETWORK_CHANGE:'NetworkChangedPleaseUpdate',
  SAVE_TXN_ID:'SaveCurrentTransactionId',
  GET_TXN_ID:'GetCurrentTransactionId',
  GET_CONVERSION_RATES:'GetNewConversionRates',
  RECOVER:'ResetAll'
});

const Networks = {
  TESTNET:'testnet',
  MAINNET:'mainnet',
};

const External_Channels = Object.freeze({
  CONNECT:'ConnectToExtension',
  SEND:'SendTransactionFromExtension',
  GETDATA:'GetInitData',
  GETDATA_RES:'GetInitDataResponse',
  CONNECT_RES:'ConnectToExtensionResponse',
  SEND_RES:'SendTransactionFromExtensionResponse',
  SEND_CUSTOM_ACTION:'SendCustomFromExtensionAction',
  SEND_CUSTOM_ACTION_RESPONSE:'SendCustomActionFromExtensionResponse'
});

const Extention = Object.freeze({
  NAME:'EOS Pulse',
  ID:'jlnbnjlakmkkhcmjbloceddnmclmfieo'
});

const Error_Codes = Object.freeze({
  USER_REJECTED:'30152',
  PRIVACY_MODE_ON:'30153',
  REQUESTER_NOT_ALLOWED:'30154',
  NO_ACCOUNT:'30156',
  REQUIRED_FIELDS_ARE_MISSING:'30157'
});

const Errors = Object.freeze({
  CPU_EXCEEDED : "More CPU required to complete the transaction",
  DUPLICATE_ACCOUNT:'Account name already taken',
  PASSWORD_MISSING:'Please enter your password',
  PASSWORD_MISMATCH:'Incorrect password',
  PASSWORD_VALIDATION:'Make sure all the conditions matched for password',
  PASSWORD_MUST_SAME:'Password and confirm password must be same',
  INSUFFICIENT_FUNDS:'Insufficient funds',
  ACCOUNT_VALIDATION_ERROR:'Account name should have 12 symbols (a-z lower case only, . , 1-5 are allowed)',
  WRONG_ACCOUNT_NAME:'Please provide valid receiver account name',
  ACCOUNT_NOT_FOUND:'Sorry account not found',
  ACCOUNT_AND_KEY_MISSMATCH:'Account Name and Private Key do not match',
  MISSING_FIELDS:'Please fill all the required fields',
  RETRY:'Please try again later',
  MISSING_NAME:'Please provide receiver account name',
  MiSSING_AMOUNT:'Please provide amount',
  MISSING_SYMBOL:'Please choose a token',
  MISSING_NET_QUNATITY:'Please provide net quantity',
  MISSING_CPU_QUNATITY:'Please provide CPU quantity',
  SAME_FROM_AND_TO:'You cannot send tokens to yourself',
  PRIVATE_KEY_ERROR:'Invalid private key',
  TRANSACTION_ID_MISSING:'Please enter your transaction id',
  INCORRECT_CREATOR:'Sorry you have sent on incorrect address',
  INCORRECT_AMOUNT:'Sorry incorrect amount sent',
  INCORRECT_MEMO_TAG:'Sorry incorrect memo',
  INCORRECT_TXN_ID:'Invalid transaction id',
  COMMON:'Something went wrong',
  MISSING_CONTRACT:'please send the contract name',
  INCORRECT_CONTRACT:'invalid contract address',
  MISSING_ACTION:'please send the action u want to perform',
  WRONG_NODE_ADDRESS:'cannot connect to the node',
  DUPLICATE_NETWORK_NAME:'network name already exists',
  TOKEN_DOESNOT_EXISTS:'token doesnot exists'
});

const Conversion_Rates = Object.freeze({
  NAME:"Conversion_Controller"
});



module.exports = {Conversion_Rates,Transaction_Status,Database_Controllers,Channel_Names,Networks,External_Channels,Extention,Error_Codes,Errors};