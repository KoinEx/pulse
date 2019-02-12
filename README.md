# PULSE -  Chrome Extension for EOS.

Pulse is an open source browser extension for EOS blockchain. It is the gateway to send, receive or stake EOS and its custom tokens. It enables easy integration with customised dApps and supports multiple accounts on various EOS networks.
Pulse can be used to transact all EOS based tokens. One can send, receive or stake EOS and its custom tokens from wallets and exchanges globally. One can easily contribute to the Pulse source code or can even create multiple extensions on top of it. The open repository even allows developers to create similar dApps such as Pulse. It features a Private mode which if enabled helps in protecting sensitive information from connected dApps

## Running

 ``` 
#Steps to add a chrome extension

open chrome
click more tools option
select extensions option
enable developer option by toggle switch in the right top
click on load unpacked option and choose the folder (pulse) i.e you just generated using npm start
 ```


### Prerequisites

``Nodejs``

### Installing

```
git clone #link
npm install
npm start 

After npm start your server will start and a folder (pulse)  will be generated.
Now add this folder as chrome extension
```

## Dapp Developers

Following API are exposed for Dapp Development :

```
1. eosWallet.connect() : To connect the Dapp with extension.

2. eosWallet.sendTransaction({to:"helloworld12",amount:"1.0000",symbol:"EOS",memo:"h"}): 
This API helps to send the EOS from Dapp to desired destination.

3. eosWallet.sendCustomAction("mytokenanccnt","transfer",{from:"giveurselectedaccountname",to:"helloworld12",amount:"1.0000",symbol:"EOS",memo:"h"}):
   
   Helps in performing custom actions from selected contract.
    
```

## Built With

`npm`

## Contributing

We have put all of our contribution guidelines into [CONTRIBUTION.md](CONTRIBUTION.md) Check it out to get started.

## Authors

* **Himanshu Singh**  

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

