# lz-dapp-mobile
  _from Lestonz_
  #MakingBetter


[![Lestonz](https://imgyukle.com/f/2022/11/23/J5ZYa1.png)](https://lestonz.com)


We are a team that has set out to combine your ideas and dreams with Web3 technology. 
We will do our best to migrate all Web2 and Web1 based applications to Web3.


----------------------------------------------------------------------------------
## SPONSOR AND PRODUCTS

[![Lz-Socials](https://imgyukle.com/f/2022/11/23/J5ZfoH.png)]([https://lestonz.com](https://lzsocials.live))                                          

[![Lz-News](https://imgyukle.com/f/2022/11/23/J5ZwHA.png)]([https://lestonz.com]([https://lzsocials.live/](https://play.google.com/store/apps/details?id=com.lznews&hl=us&gl=US))) 

----------------------------------------------------------------------------------
## Installation

Start:

```sh
npx lz-dapp-mobile
```

Enter your app name:

```sh
lz-dapp
```

Enter your app URI scheme:

```sh
reactnative
```

Enter your app file:

```sh
cd lz-dapp
```

Run your device:

```sh
yarn ios
yarn android
```

## Recommend

We recommend you to use physical device after installing ios or android files.
You should change .env file's datas for hardhat.config.js

## Deploy to Smart Contract

You should open another terminal for Truffle Dashboard:

```sh
npx truffle dashboard
```

You can write in first terminal.

```sh
deploy:truffle
```
After that copy and paste your Smart Contract Address for config.js file, 
and copy and paste your own provider link.

```sh
YOUR_SMART_CONTRACT_ADDRESS
YOUR_PROVIDER_LINK
```

Open frontend/App.js file



# Your Transaction Data Should Be Hexadecimal.


```sh
const tx = {
  from: address, 
  to: `${YOUR_SMART_CONTRACT_ADDRESS}`,
  data: `${contractData}`,
  value:`${value}`,
  gasPrice: web3Provider.utils.toWei('10', 'gwei')    
}
```
or

```sh
const txSecond ={
  data: '0x',
  from: '0x8B6FE676217eEE2C9Cf484203Cb8855ca85eB07D',
  gas: '0x9c40',
  gasPrice: '0x02540be400',
  nonce: '0x0114',
  to: '0xa979143B16a3C61b317385C7dC3C269503B88c92',
  value: '0x00',
}
```
----------------------------------------

## Visit to 
#### [lestonz.com](https://lestonz.com/)
#### [GitHub](https://www.linkedin.com/company/lestonz)
#### [LinkedIn](https://www.linkedin.com/company/lestonz?original_referer)
#### [Twitter](https://twitter.com/lestonz)

#### Don't forget to follow me on Social Media :)

 _Your Beautiful Lz-DApp is ready for coding_
