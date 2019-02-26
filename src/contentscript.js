import {External_Channels } from './app/constants/enums';

// all the events emited here get catch on websites

const getData = () => {
  var port = chrome.runtime.connect({name:External_Channels.GETDATA});
  port.postMessage({});
  port.onMessage.addListener((response)=>{
    if(response.status) { 
      window.dispatchEvent(new CustomEvent(External_Channels.GETDATA_RES,{detail:response}));
      port.disconnect();
    }
  });
}

const connect = () => {
  var port = chrome.runtime.connect({name:External_Channels.CONNECT});
  port.postMessage({message:'handshake'});
}

const sendTransaction = (tranaction)=>{
  console.log("Details ==> ",tranaction);
  var port = chrome.runtime.connect({name:External_Channels.SEND});
  port.postMessage(tranaction.detail);
}

const sendCustomAction = (customAction)=>{
  console.log("Custom Details ==> ",customAction);
  var port = chrome.runtime.connect({name:External_Channels.SEND_CUSTOM_ACTION});
  port.postMessage(customAction.detail);
}


// event listners for events emitted from any js website

window.addEventListener(External_Channels.SEND_CUSTOM_ACTION,sendCustomAction);
window.addEventListener(External_Channels.GETDATA,getData);
window.addEventListener(External_Channels.CONNECT,connect);
window.addEventListener(External_Channels.SEND,sendTransaction);


// dispach events after getting response form the bg script
chrome.runtime.onConnect.addListener((port)=>{
  port.onMessage.addListener((response)=>{
    port.disconnect();
    window.dispatchEvent(new CustomEvent(`${port.name}Response`,{detail:response}));
  });
});


// inject the contentScript to every js enabled website

const injectPulseScript = async ()=>{
  if(window.document){
    const codeScript = document.createElement('script');
    codeScript.src = chrome.extension.getURL('vendor.min.js');
    (window.document.head || window.document.documentElement).appendChild(codeScript);
    codeScript.remove(); // this remove the code after injection
  }
};

injectPulseScript();
