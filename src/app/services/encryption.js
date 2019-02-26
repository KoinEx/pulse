
export default class EncryptionService{

  constructor(){}

  encrypt(key,value){ // to encrypt the private key by password
    return Promise.resolve(encrypt(value,key).toString());
  }

  decrypt(key,value){ // to decrypt the private key by password
    return Promise.resolve(decrypt(value,key).toString(this.enc.Utf8));
  }

  encryptSalt(key,value){ // to encrypt the salt
    return Promise.resolve(encrypt(value,key).toString());
  }

  decryptSalt(key,value){ // to decrypt the salt
    try{
      return Promise.resolve(decrypt(value,key).toString(this.enc.Utf8));
    } catch(err){
      return Promise.resolve('wrong password');
    }
  }

}
EncryptionService.$inject = [];
