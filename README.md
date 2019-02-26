# PULSE -  Chrome Extension for EOS.

Pulse is an open source browser extension for EOS blockchain. It enables easy integration with customised dApps and supports multiple accounts on various EOS networks.
Pulse can be used to transact all EOS based tokens. One can send, receive or stake EOS and its custom tokens from wallets and exchanges globally. One can easily contribute to the Pulse source code or can even create multiple extensions on top of it. The open repository even allows developers to create similar dApps such as Pulse. It features a Private mode which if enabled helps in protecting sensitive information from connected dApps

## Dapp Developers

Following API are exposed for Dapp Development :

```js
pulse object can be accessed from every js enabled website under window object.

All the functions provided below are return promises which have to be handled.

pulse contains a varibale network which provides selected network 


1. pulse.connect() : To connect the Dapp with extension.
   response object 
   {status:"success",data:{account_name:"selected_account_name",tokens:["1.0000 EOS","10.0000 JUNGLE"]}}
   {status:"error",message:"some error message",code:"error code"}
    

2. pulse.sendTransaction({to:"helloworld12",amount:"1.0000",symbol:"EOS",memo:"h"}): //given keys are mandatory
   This API helps to send the EOS from Dapp to desired destination.
   
   response object 
   {status:"error",message:"some error message",code:"error code"} // if non-blockchain error occurs
   
  

options = {param1:"value", ... } // params for contract action
3. pulse.sendCustomAction("your_contract_address","contract_action_name", options ):
   
   Helps in performing custom actions from selected contract.
   
4. pulse.init()

   Helps in updating pulse object.
    
```
## Example

```js
 if (pulse){
  // extension installed
 
  const network = pusle.network;
  if (network != "mainnet"){  
   // user is not on mainnet ask to switch if required
   // do pulse.init() to get the pulse object updated without and re-assign the network = pusle.network; 
   // or do window.reload()
  } else {
   // bussiness logic
   // as per logic do sendTransaction or sendCustomAction 
   
  }
 } 
 
```

## Error Codes

```js
  code : '30152' // user rejected the requests
  code : '30153' // privacy mode is on
  code : '30156' // no account configured yet
  code : '30157' // missing required fiels

```

### Prerequisites

``Nodejs``

### Building from Source

```
git clone 
npm install
npm start 

After npm start your server will start and a folder (pulse)  will be generated.
Now add this folder as chrome extension
```

## Running

 ``` 
Steps to add a chrome extension

open chrome
click more tools option
select extensions option
enable developer option by toggle switch in the right top
click on load unpacked option and choose the folder (pulse) i.e you just generated using npm start
 ```


## Built With

`npm`

## Contributing

We have put all of our contribution guidelines into [CONTRIBUTION.md](CONTRIBUTION.md) Check it out to get started.

## Authors

* **Himanshu Singh**  

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
