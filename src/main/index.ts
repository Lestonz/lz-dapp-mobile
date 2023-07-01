import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import chalk from 'chalk';
import { ethers } from 'ethers';
import { flatten, unflatten } from 'flat';

import {
  createContext,
  createParams,
  createResult,
  CreationStatus,
  EnvVariable,
  EnvVariables,
  HardhatOptions,
} from '../types';

const port = 8545;

const prettyStringify = (obj: object): string => JSON.stringify(obj, null, 2);

const injectFlattenedJsonToFile = (
  file: string,
  options: object,
  maybeUnflattened?: object
) => {
  !fs.existsSync(file) && fs.writeFileSync(file, JSON.stringify({}));
  fs.writeFileSync(
    file,
    prettyStringify({
      ...unflatten({
        ...(flatten(
          JSON.parse(fs.readFileSync(file, 'utf-8'))
         
        ) as object),
        ...options,
      }),
      ...(typeof maybeUnflattened === 'object' ? maybeUnflattened : {}),
    })
  );
};

const createBaseProject = ({ name }: createParams) =>
  execSync(`npx create-react-native-app ${name} -t with-typescript`, {
    stdio: 'inherit',
  });



const setAppIcon = (ctx: createContext) => {
  const { projectDir } = ctx;
  const assetsDir = path.resolve(projectDir, 'assets');

  !fs.existsSync(assetsDir) && fs.mkdirSync(assetsDir);

  ['image', 'video', 'json', 'raw'].map((type: string) => {
    const dir = path.resolve(assetsDir, type);
    const gitkeep = path.resolve(dir, '.gitkeep');
    !fs.existsSync(dir) && fs.mkdirSync(dir);
    fs.writeFileSync(gitkeep, '');
  });

  const appIcon = path.resolve(assetsDir, 'image', 'app-icon.png');

  fs.copyFileSync(require.resolve('../assets/app-icon.png'), appIcon);

  const assetDeclarations = path.resolve(assetsDir, 'index.d.ts');
  fs.writeFileSync(
    assetDeclarations,
    `
import { ImageSourcePropType } from 'react-native';

declare module '*.png' {
  export default ImageSourcePropType;
}

declare module '*.jpg' {
  export default ImageSourcePropType;
}

declare module '*.jpeg' {
  export default ImageSourcePropType;
}

declare module '*.gif' {
  export default ImageSourcePropType;
}

declare module '*.mp4' {
  export default unknown;
}
    `.trim(),
  );

};

const createFileThunk = (root: string) => (f: readonly string[]): string => {
  return path.resolve(root, ...f);
};

const hardhatOptions = async (
  projectFile: (f: readonly string[]) => string,
  scriptFile: (f: readonly string[]) => string
): Promise<HardhatOptions> => {
  const hardhatAccounts = await Promise.all(
    [...Array(10)].map(async () => {
      const { privateKey } = await ethers.Wallet.createRandom();
      return { privateKey, balance: '1000000000000000000000' }; // 1000 ETH
    })
  );
  return {
    hardhat: scriptFile(['hardhat.ts']),
    hardhatConfig: projectFile(['hardhat.config.js']),
    hardhatAccounts,
  } as HardhatOptions;
};

const createBaseContext = async (
  params: createParams
): Promise<createContext> => {
  const { name } = params;
  const projectDir = path.resolve(name);
  const scriptsDir = path.resolve(projectDir, 'scripts');
  const testsDir = path.resolve(projectDir, '__tests__');
  const projectFile = createFileThunk(projectDir);
  const scriptFile = createFileThunk(scriptsDir);
  const srcDir = path.resolve(projectDir, 'frontend');
  return Object.freeze({
    ...params,
    yarn: fs.existsSync(projectFile(['yarn.lock'])),
    hardhat: await hardhatOptions(projectFile, scriptFile),
    projectDir,
    scriptsDir,
    testsDir,
    srcDir,
  });
};

// TODO: Find a nice version.
const shimProcessVersion = 'v9.40';

const injectShims = (ctx: createContext) => {
  const { projectDir } = ctx;
  fs.writeFileSync(
    path.resolve(projectDir, 'index.js'),
    `
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */

// This file has been auto-generated by Ξ create-react-native-dapp Ξ.
// Feel free to modify it, but please take care to maintain the exact
// procedure listed between /* dapp-begin */ and /* dapp-end */, as
// this will help persist a known template for future migrations.

/* dapp-begin */
const { Platform, LogBox } = require('react-native');

if (Platform.OS !== 'web') {
  require('react-native-get-random-values');
  LogBox.ignoreLogs(
    [
      "The provided value 'ms-stream' is not a valid 'responseType'.",
      "The provided value 'moz-chunked-arraybuffer' is not a valid 'responseType'.",
    ],
  );
}

if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

global.btoa = global.btoa || require('base-64').encode;
global.atob = global.atob || require('base-64').decode;

process.version = '${shimProcessVersion}';

const { registerRootComponent, scheme } = require('expo');
const { default: App } = require('./frontend/App');

const { default: AsyncStorage } = require('@react-native-async-storage/async-storage');

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in the Expo client or in a native build,
// the environment is set up appropriately
registerRootComponent(App, {
  redirectUrl: Platform.OS === 'web' ? window.location.origin : \`\${scheme}://\`,
  storageOptions: {
    asyncStorage: AsyncStorage,
  },
});
/* lz-dapp-end */
    `.trim()
  );
};

const createScripts = (ctx: createContext) => {
  const { scriptsDir } = ctx;
  !fs.existsSync(scriptsDir) && fs.mkdirSync(scriptsDir);
//   const melih = path.resolve(scriptsDir, 'melih.ts');
  const android = path.resolve(scriptsDir, 'android.ts');
  const ios = path.resolve(scriptsDir, 'ios.ts');
  const web = path.resolve(scriptsDir, 'web.ts');
  const deployContract = path.resolve(scriptsDir, 'deployContract.js');

  fs.writeFileSync(
    deployContract, 
    `
    const hre = require("hardhat");

async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using 'node' you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');

    // We get the contract to deploy
    console.log("Deploying your contract...")
    console.log("Keep your contract address and you shoul paste in env.")

    const HelloLestonz = await hre.ethers.getContractFactory("HelloLestonz");
    const helloLestonz = await HelloLestonz.deploy();

    await helloLestonz.deployed();

    console.log("Welcome to Lestonz Lz-DApp, your contract address: ", helloLestonz.address )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});
    `.trim()
  )


  fs.writeFileSync(
    android,
    `
import 'dotenv/config';
import * as child_process from 'child_process';

import * as appRootPath from 'app-root-path';
import * as chokidar from 'chokidar';

const opts: child_process.ExecSyncOptions = { cwd: \`\${appRootPath}\`, stdio: 'inherit' };

chokidar.watch('contracts').on('all', () => {
  child_process.execSync('npx hardhat compile', opts);
});

child_process.execSync('npx kill-port ${port}', opts);
child_process.execSync('adb reverse tcp:${port} tcp:${port}', opts);

child_process.execSync('npx hardhat node --hostname 0.0.0.0 & expo run:android &', opts);
    `.trim(),
  );
  fs.writeFileSync(
    ios,
    `
import 'dotenv/config';
import * as child_process from 'child_process';

import * as appRootPath from 'app-root-path';
import * as chokidar from 'chokidar';

const opts: child_process.ExecSyncOptions = { cwd: \`\${appRootPath}\`, stdio: 'inherit' };

chokidar.watch('contracts').on('all', () => {
  child_process.execSync('npx hardhat compile', opts);
});

child_process.execSync('npx kill-port ${port}', opts);
child_process.execSync('npx hardhat node --hostname 0.0.0.0 & expo run:ios &', opts);
    `.trim(),
  );
  fs.writeFileSync(
    web,
    `
import 'dotenv/config';
import * as child_process from 'child_process';

import * as appRootPath from 'app-root-path';
import * as chokidar from 'chokidar';

const opts: child_process.ExecSyncOptions = { cwd: \`\${appRootPath}\`, stdio: 'inherit' };

chokidar.watch('contracts').on('all', () => {
  child_process.execSync('npx hardhat compile', opts);
});

child_process.execSync('npx kill-port 8545', opts);
child_process.execSync('expo web & npx hardhat node --hostname 0.0.0.0 &', opts);
    `.trim(),
  );
};

const getAllEnvVariables = (ctx: createContext): EnvVariables => {
  const { hardhat: { hardhatAccounts } } = ctx;
  return [
    ['APP_DISPLAY_NAME', 'string', `${ctx.name}`],
    ['HARDHAT_PORT', 'string', `${port}`],
    ['HARDHAT_PRIVATE_KEY', 'string', hardhatAccounts[0].privateKey],
    ['BLOCK_EXPLORER_API_KEY', 'string', "818hIAJSDIA0E299021O31230*12EKP*12KE"],
    ['BLOCK_EXPLORER_API_KEY_BSC_TESTNET', 'string', "818hIAJSDIA0E299021O31230*12EKP*12KE"],
  ];
};



const shouldPrepareTypeRoots = (ctx: createContext) => {
  const stringsToRender = getAllEnvVariables(ctx).map(
    ([name, type]: EnvVariable) => `   export const ${name}: ${type};`
  );
  return fs.writeFileSync(
    path.resolve(ctx.projectDir, 'index.d.ts'),
    `
declare module '@env' {
${stringsToRender.join('\n')}
}
    `.trim()
  );
};

const shouldPrepareSpelling = (ctx: createContext) => fs.writeFileSync(
  path.resolve(ctx.projectDir, '.cspell.json'),
  prettyStringify({
    words: ["bytecode", "dapp"],
  }),
);

const shouldPrepareTsc = (ctx: createContext) => {
  fs.writeFileSync(
    path.resolve(ctx.projectDir, 'tsconfig.json'),
    prettyStringify({
      compilerOptions: {
        allowSyntheticDefaultImports: true,
        jsx: 'react-native',
        lib: ['dom', 'esnext'],
        moduleResolution: 'node',
        noEmit: true,
        skipLibCheck: true,
        resolveJsonModule: true,
        typeRoots: ['index.d.ts'],
        types: ['node', 'jest'],
      },
      include: ['**/*.ts', '**/*.tsx'],
      exclude: [
        'node_modules',
        'babel.config.js',
        'metro.config.js',
        'jest.config.js',
        '**/*.test.tsx',
        '**/*.test.ts',
        '**/*.spec.tsx',
        '**/*.spec.ts',
      ],
    })
  );
};

const preparePackage = (ctx: createContext) =>
  injectFlattenedJsonToFile(
    path.resolve(ctx.projectDir, 'package.json'),
    {
      homepage: 'https://lestonz.com',
      license: 'MIT',
      contributors: [
        {
          name: '@lestonz',
          url: "https://github.com/lestonz"
        },
      ],
      keywords: [
        'react-native',
        'blockchain',
        'dapp',
        'ethereum',
        'web3',
        'web3Mobile',
      ],
      // scripts
      'scripts.audit': `${ctx.yarn ? '' : 'npm_config_yes=true '}npx yarn-audit-fix`,
      'scripts.test': 'npx hardhat test && jest',
      'scripts.android': 'expo run:android',
      'scripts.ios': 'expo run:ios',
      'scripts.web': 'node_modules/.bin/ts-node scripts/web',
      'scripts.web:deploy': 'expo build:web && gh-pages -d web-build',
      'scripts.deploy': 'npx hardhat run scripts/deployContract.js',
      'scripts.deploy:truffle': 'npx hardhat run scripts/deployContract.js --network truffle',
      "scripts.verify:truffle" :"npx hardhat verify --network truffle",
      // dependencies
      'dependencies.@react-native-async-storage/async-storage': '1.17.3',
      'dependencies.@walletconnect/modal-react-native': '1.0.0-rc.3',
      'dependencies.@react-native-clipboard/clipboard': '1.11.2',
      'dependencies.react-native-svg': '9.6.4',
      'dependencies.base-64': '1.0.0',
      'dependencies.buffer': '6.0.3',
      'dependencies.node-libs-browser': '2.2.1',
      'dependencies.path-browserify': '0.0.0',
      'dependencies.react-native-crypto': '2.2.0',
      'dependencies.react-native-dotenv': '2.4.3',
      'dependencies.react-native-localhost': '1.0.0',
      'dependencies.react-native-get-random-values': '1.5.0',
      'dependencies.react-native-stream': '0.1.9',
      'dependencies.web3': '^1.10.0',
      'devDependencies.@babel/core': '7.15.5',
      'devDependencies.@babel/plugin-proposal-private-property-in-object': '7.15.4',
      'devDependencies.@babel/preset-env': '7.15.6',
      'devDependencies.@babel/preset-typescript': '7.15.0',
      'devDependencies.app-root-path': '3.0.0',
      'devDependencies.babel-jest': '29.3.1',
      'devDependencies.chokidar': '3.5.1',
      'devDependencies.commitizen': '4.2.3',
      'devDependencies.cz-conventional-changelog': '^3.2.0',
      'devDependencies.dotenv': '8.2.0',
      'devDependencies.husky': '4.3.8',
      'devDependencies.prettier': '2.2.1',
      'devDependencies.platform-detect': '3.0.1',
      'devDependencies.@typescript-eslint/eslint-plugin': '^4.0.1',
      'devDependencies.@typescript-eslint/parser': '^4.0.1',
      'devDependencies.@openzeppelin/contracts': '^4.7.3',
      'devDependencies.eslint': '^7.8.0',
      'devDependencies.eslint-config-prettier': '^6.11.0',
      'devDependencies.eslint-plugin-eslint-comments': '^3.2.0',
      'devDependencies.eslint-plugin-functional': '^3.0.2',
      'devDependencies.eslint-plugin-import': '^2.22.0',
      'devDependencies.eslint-plugin-react': '7.22.0',
      'devDependencies.eslint-plugin-react-native': '3.10.0',
      'devDependencies.lint-staged': '10.5.3',
      'devDependencies.@types/node': '14.14.22',
      "devDependencies.@types/jest": '^26.0.20',
      'devDependencies.hardhat': '2.0.6',
      'devDependencies.@nomiclabs/hardhat-ethers': '^2.0.1',
      'devDependencies.@nomiclabs/hardhat-waffle': '^2.0.1',
      'devDependencies.chai': '^4.2.0',
      'devDependencies.ethereum-waffle': '^3.2.1',
      'devDependencies.gh-pages': '^3.2.3',
      'devDependencies.jest': '29.3.1',
      'devDependencies.react-test-renderer': '17.0.1',
      'devDependencies.ts-node': '9.1.1',
      'devDependencies.@nomiclabs/hardhat-etherscan': '^3.1.2',
      // react-native
      'react-native.stream': 'react-native-stream',
      'react-native.crypto': 'react-native-crypto',
      'react-native.path': 'path-browserify',
      'react-native.process': 'node-libs-browser/mock/process',
      // jest
      'jest.preset': 'react-native',
      'jest.testMatch': ["**/__tests__/frontend/**/*.[jt]s?(x)"],
      'jest.transformIgnorePatterns': ['node_modules/(?!@ngrx|(?!deck.gl)|ng-dynamic)']
    },
    {
      config: {
        commitizen: {
          path: './node_modules/cz-conventional-changelog'
        }
      },
      husky: {
        hooks: {
          'prepare-commit-msg': 'exec < /dev/tty && git cz --hook',
          'pre-commit': 'lint-staged && tsc',
          'pre-push': 'test'
        }
      },
      'lint-staged': {
        '*.{ts,tsx,js,jsx}': "eslint --fix --ext '.ts,.tsx,.js,.jsx' -c .eslintrc.json",
      },
    }
  );

const shouldPrepareMetro = (ctx: createContext) =>
  fs.writeFileSync(
    path.resolve(ctx.projectDir, 'metro.config.js'),
    `
const extraNodeModules = require('node-libs-browser');

module.exports = {
  resolver: {
    extraNodeModules,
  },
  transformer: {
    assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  },
};
    `.trim()
  );

const shouldPrepareBabel = (ctx: createContext) =>
  fs.writeFileSync(
    path.resolve(ctx.projectDir, 'babel.config.js'),
    `
module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      ['@babel/preset-env', {targets: {node: 'current'}}],
      '@babel/preset-typescript',
    ],
    plugins: [
      ['@babel/plugin-proposal-private-property-in-object', {loose: true}],
      ['module:react-native-dotenv'],
    ],
  };
};
    `.trim()
  );

const shouldPrepareEslint = (ctx: createContext) =>
  fs.writeFileSync(
    path.resolve(ctx.projectDir, '.eslintrc.json'),
    prettyStringify({
      root: true,
      parser: '@typescript-eslint/parser',
      env: { es6: true },
      ignorePatterns: [
        'node_modules',
        'build',
        'coverage',
        'babel.config.js',
        'metro.config.js',
        'hardhat.config.js',
        '__tests__/contracts',
      ],
      plugins: ['import', 'eslint-comments', 'functional', 'react', 'react-native'],
      extends: [
        'eslint:recommended',
        'plugin:eslint-comments/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/typescript',
        'plugin:functional/lite',
        'prettier',
        'prettier/@typescript-eslint',
      ],
      globals: {
        // TODO: Enable support in RN for BigInteger.
        //BigInt: true,
        console: true,
        __DEV__: true,
      },
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        'eslint-comments/disable-enable-pair': [
          'error',
          { allowWholeFile: true },
        ],
        'eslint-comments/no-unused-disable': 'error',
        'import/order': [
          'error',
          { 'newlines-between': 'always', alphabetize: { order: 'asc' } },
        ],
        'sort-imports': [
          'error',
          { ignoreDeclarationSort: true, ignoreCase: true },
        ],
        'sort-keys': [
          'error',
          'asc',
          {
            'caseSensitive': true,
            'natural': false,
            'minKeys': 2,
          },
        ],
        'react-native/no-unused-styles': 2,
        'react-native/split-platform-components': 2,
        'react-native/no-inline-styles': 2,
        'react-native/no-color-literals': 2,
        'react-native/no-raw-text': 2,
        'react-native/no-single-element-style-arrays': 2,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    })
  );

const shouldWriteEnv = (ctx: createContext) => {
  const lines = getAllEnvVariables(ctx).map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([name, _type, value]) => `${name}=${value}`
  );
  const env = path.resolve(ctx.projectDir, '.env');
  const example = path.resolve(ctx.projectDir, '.env.example');
  fs.writeFileSync(env, `${lines.join('\n')}\n`);
  fs.copyFileSync(env, example);
};

const shouldWriteConfigJS = (ctx: createContext) => {

  const config = path.resolve(ctx.projectDir, 'config.js');
  const exampleConfig = path.resolve(ctx.projectDir, 'config.example.js');
  fs.writeFileSync(config, `

  export const YOUR_SMART_CONTRACT_ADDRESS = "0xB7738e7C6471EC2443D7DBfD3581bCCE12E81012"
  export const YOUR_PROVIDER_LINK_GOERLI = "https://goerli.infura.io/v3/YourProviderID"
  
  `.trim() );
  fs.copyFileSync(config, exampleConfig);
};


const shouldInstall = (ctx: createContext) =>
  execSync(
    `${ctx.yarn ? 'yarn' : 'npm i'}`,
    {
      stdio: 'inherit',
      cwd: `${ctx.projectDir}`,
    }
  );

const getExampleContract = () =>
  `
  // SPDX-License-Identifier: MIT
  /* @development by lestonz */
  pragma solidity >=0.6.0 <0.9.0;
  
  contract HelloLestonz {
    uint256 number;
  
    function sayHelloLestonz() public pure returns (string memory) {
        return "Hello Lestonz";
    }
  
    function giveNumber(uint256 _number ) public {
      number = _number;
    } 
  
    function readNumber() external view returns (uint256) {
        return number;
    }
  }
`.trim();

const shouldPrepareExample = (ctx: createContext) => {
  const {
    projectDir,
    testsDir,
    srcDir,
    hardhat: {
      hardhatConfig,
      hardhatAccounts,
    },
  } = ctx;

  const contracts = path.resolve(projectDir, 'contracts');


  !fs.existsSync(contracts) && fs.mkdirSync(contracts);

  !fs.existsSync(testsDir) && fs.mkdirSync(testsDir);

  const contractsTestDir = path.resolve(testsDir, 'contracts');
 

  fs.mkdirSync(contractsTestDir);


  fs.writeFileSync(path.resolve(contractsTestDir, '.gitkeep'), '');


  const contractTest = path.resolve(contractsTestDir, 'HelloLestonz.test.js');


  fs.writeFileSync(
    contractTest,
    `
const { expect } = require('chai');

describe("HelloLestonz", function() {
  it("Should return the default greeting", async function() {
    const HelloLestonz = await ethers.getContractFactory("HelloLestonz");
    const helloLestonz = await HelloLestonz.deploy();

    await helloLestonz.deployed();

    console.log("Welcome to Lestonz Lz-DApp, your contract address: " ,helloLestonz.address )
  });
});
    `
  );

  const contract = path.resolve(contracts, 'HelloLestonz.sol');
  fs.writeFileSync(contract, getExampleContract());

  fs.writeFileSync(
    hardhatConfig,
    `
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("@nomiclabs/hardhat-waffle");
require("dotenv/config");
require("@nomiclabs/hardhat-etherscan");

const { HARDHAT_PORT } = process.env;
const DEFAULT_GAS_MULTIPLIER = 1;
module.exports = {
  solidity: "0.8.4",
  networks: {
    // localhost: { url: \`http://127.0.0.1:\${HARDHAT_PORT}\` },
    // hardhat: {
    //   accounts: ${JSON.stringify(hardhatAccounts)}
    // },
    truffle: {
      url: 'http://localhost:24012/rpc',
      timeout: 60000,
      gasMultiplier: DEFAULT_GAS_MULTIPLIER,
    }
  },
  etherscan: {
    apiKey: {
      // Ethereum
      goerli: process.env.BLOCK_EXPLORER_API_KEY,
      // mainnet: process.env.BLOCK_EXPLORER_API_KEY,
      bscTestnet: process.env.BLOCK_EXPLORER_API_KEY_BSC_TESTNET,
      // // Polygon
      // polygon: process.env.BLOCK_EXPLORER_API_KEY,
      // polygonMumbai: process.env.BLOCK_EXPLORER_API_KEY,
    },
  },
  paths: {
    sources: './contracts',
    tests: './__tests__/contracts',
    cache: './cache',
    artifacts: './artifacts',
  },
};
    `.trim()
  );

  !fs.existsSync(srcDir) && fs.mkdirSync(srcDir);

  fs.writeFileSync(
    path.resolve(srcDir, 'App.js'),
    `

import { ScrollView, TextInput, Text, SafeAreaView, TouchableOpacity, View, Image, Linking } from 'react-native';
import { WalletConnectModal, useWalletConnectModal } from '@walletconnect/modal-react-native';
import { YOUR_PROVIDER_LINK_GOERLI, YOUR_SMART_CONTRACT_ADDRESS } from '../config';
import React, { useState, useEffect, useMemo } from 'react';
import { scheme } from 'expo'
import Web3 from 'web3';
import Clipboard from '@react-native-clipboard/clipboard';
import HelloLestonz from '../artifacts/contracts/HelloLestonz.sol/HelloLestonz.json';

const appIcon = require('../assets/image/app-icon.png')

/** You should take a projectId and providerMetadata from walletconnect-v2 panel */
const projectId = 'YourWalletConnectProjectId';

const providerMetadata = {
name: 'Lestonz',
description: 'Lestonz DApp',
url: 'https://react-web3wallet.vercel.app',
icons: ['https://imagedelivery.net/_aTEfDRm7z3tKgu9JhfeKA/0c24a66f-00f0-4a6d-f4bd-efab7de7a200/lg'],
redirect: {
native: \`\${scheme}://\`
}
};

export const sessionParams = {
namespaces: {
eip155: {
  methods: [
    'eth_sendTransaction',
    'eth_sign',
    'personal_sign',
    'eth_signTypedData',
  ],
  chains: ['eip155:1'], // You should choose your network params.This is Ethereum Mainnet
  events: ['chainChanged', 'accountsChanged'],
  rpcMap: {},
},
},
optionalNamespaces: {
eip155: {
  methods: [
    'eth_sendTransaction',
    'eth_sign',
    'personal_sign',
    'eth_signTypedData',
  ],
  chains: ['eip155:5'], // You should choose your network params.This is Ethereum Goerli
  events: ['chainChanged', 'accountsChanged'],
  rpcMap: {},
},
},
};


function App() {
const { open, provider, isConnected, address } = useWalletConnectModal();
const [yourNumber, setYourNumber] = useState(0);
const [readDataNumber, setReadDataNumber] = useState(0)

//For smartContract provider. If you are using testnet, you should use diffrent provider. 
const web3ProviderContract = useMemo(
() => new Web3(new Web3.providers.HttpProvider(YOUR_PROVIDER_LINK_GOERLI))
)

// For wallet connection provider
const web3Provider = useMemo(
() => new Web3(provider ? new Web3(provider) : new Web3.providers.HttpProvider(YOUR_PROVIDER_LINK_GOERLI)), [provider]
);

// For Smart Contract Uploding
const myContract = new web3ProviderContract.eth.Contract(HelloLestonz.abi, YOUR_SMART_CONTRACT_ADDRESS)

useEffect(() => {
myContract
}, []);

const onCopy = (value) => {
Clipboard.setString(value);
};

const connectYourWallet = async () => {
return open();
};

const disconnectYourWallet = async () => {
return provider?.disconnect();
};

const writeData = async () => {
try {
  console.log(yourNumber)
  const contractData = await myContract.methods.giveNumber(yourNumber).encodeABI()
  const tx = {
    from: address, // Sender account address
    to: \`\${YOUR_SMART_CONTRACT_ADDRESS}\`, // Recipient account address
    value: web3Provider.utils.toWei('0', 'gwei'), // Amount to be sent (0.01 ether)
    gasPrice: web3Provider.utils.toWei('10', 'gwei'), // Gas price
    data: \`\${contractData}\`, // Transaction data

  };
  const transaction = await web3Provider.eth.sendTransaction(tx);
  console.log('Transaction:', transaction);

} catch (error) {
  console.log("Error from writing data:", error);
}
};

const readData = async () => {

if (myContract) {
  try {
    const contractData = await myContract.methods.readNumber().call()
    setReadDataNumber(contractData)
    return readDataNumber;
  } catch (error) {
    console.log("Error from reading data", error)
  }
} else {
  console.log("The contract could not be loaded or found.")
}
}

const signMessage = async () => {

if (!web3Provider) {
  throw new Error('web3Provider not connected');
}
const message = "Hello, welcome to Lestonz DApp! Do you want to connect this DApp?";
await web3Provider.eth.personal.sign(message, address, " ");

};

const sendEther = async () => {
try {
  const tx = {
    from: address, // Sender account address
    to: '0xBcC732b0acE59557FE2C8D86Dbca6e6d738b043c', // Recipient account address
    value: web3Provider.utils.toWei('10000000', 'gwei'), // Amount to be sent (0.01 ether)
    gasPrice: web3Provider.utils.toWei('10', 'gwei'), // Gas price
    data: '0x', // Transaction data
  };

  const transaction = await web3Provider.eth.sendTransaction(tx);
  console.log('Transaction:', transaction);

} catch (error) {
  console.log('Error from Send ETH:', error);
}
};

return (
<>
  <SafeAreaView></SafeAreaView>
  <ScrollView>
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    }} >
      <Image
        source={appIcon}
        resizeMode="cover"
        style={{
          width: 60,
          height: 60,
          marginVertical: 10
        }}
      />
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Welcome to Lz-DApp-V2</Text>
      <Text style={{ fontSize: 20, fontWeight: 'normal' }} >from Lestonz</Text>
      <TouchableOpacity
        style={{
          width: '80%',
          height: 60,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000000',
          marginVertical: 10,
          borderRadius: 10
        }}
        onPress={() => Linking.openURL('https://lestonz.com')}
      >
        <Text style={{ color: '#fff', fontSize: 24 }} >
         LESTONZ
        </Text>
      </TouchableOpacity>
      {
        !isConnected ? (
          <TouchableOpacity
            style={{
              width: '80%',
              height: 60,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#5396FF',
              marginVertical: 10,
              borderRadius: 10
            }}
            onPress={connectYourWallet}
          >
            <Text style={{ color: '#fff', fontSize: 24 }} >
              Connect Your Wallet
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }} > Your Wallet Address </Text>
            <Text selectable style={{ fontSize: 20, fontWeight: 'normal', width: '80%', textAlign: 'center' }} >{address}</Text>
            <TextInput
              style={{ height: 60, borderWidth: 1, width: '80%', marginVertical: 20, borderRadius: 10, fontSize: 20, paddingHorizontal: 10 }}
              onChangeText={(text) => setYourNumber(text)}
              value={yourNumber.toString()}
              placeholder="Enter A number"
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={{
                width: '80%',
                height: 60,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#963F74',
                marginVertical: 10,
                borderRadius: 10
              }}
              onPress={writeData}
            >
              <Text style={{ color: '#fff', fontSize: 24 }} >Send Number</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: '80%',
                height: 60,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#00BA00',
                marginVertical: 10,
                borderRadius: 10
              }}
              onPress={readData}
            >
              <Text style={{ color: '#fff', fontSize: 24 }} >Read</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: 'normal' }} >Your number is</Text>
            <Text style={{ fontSize: 20, fontWeight: 'normal' }} >{readDataNumber}</Text>
            <TouchableOpacity
              style={{
                width: '80%',
                height: 60,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#00BAFF',
                marginVertical: 10,
                borderRadius: 10
              }}
              onPress={signMessage}
            >
              <Text style={{ color: '#fff', fontSize: 24 }} >Sign In Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: '80%',
                height: 60,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#332A45',
                marginVertical: 10,
                borderRadius: 10,
              }}
              onPress={sendEther}
            >
              <Text style={{ color: '#fff', fontSize: 24 }} >Send ETH</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: '80%',
                height: 60,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#DF0000',
                marginVertical: 10,
                borderRadius: 10
              }}
              onPress={disconnectYourWallet}
            >
              <Text style={{ color: '#fff', fontSize: 24 }} >DISCONNECT</Text>
            </TouchableOpacity>
          </>
        )
      }
    </View>
  </ScrollView>
  <WalletConnectModal
    projectId={projectId}
    providerMetadata={providerMetadata}
    sessionParams={sessionParams}
    onCopyClipboard={onCopy}
  />
</>
)
}

export default App;
    `.trim()
  );

  const orig = path.resolve(projectDir, 'App.js');
  fs.existsSync(orig) && fs.unlinkSync(orig);

  execSync(`npx hardhat compile`, { cwd: `${projectDir}`, stdio: 'inherit' });
};

const getHardhatGitIgnore = (): string | null => {
  return `
# Hardhat
artifacts/
cache/
  `.trim();
};

const shouldPrepareGitignore = (ctx: createContext) => {
  const { projectDir } = ctx;
  const lines = [getHardhatGitIgnore()].filter((e) => !!e) as readonly string[];
  const gitignore = path.resolve(projectDir, '.gitignore');
  fs.writeFileSync(
    gitignore,
    `
${fs.readFileSync(gitignore, 'utf-8')}
# Environment Variables (Store safe defaults in .env.example!)
.env
config.js
# Jest
.snap

# Package Managers
${ctx.yarn ? 'package-lock.json' : 'yarn.lock'}

${lines.join('\n\n')}

  `.trim()
  );
};

const getScriptCommandString = (ctx: createContext, str: string) =>
  chalk.white.bold`${ctx.yarn ? 'yarn' : 'npm run-script'} ${str}`;

export const getSuccessMessage = (ctx: createContext): string => {
  return `
${chalk.green`✔`} Successfully integrated Web3 into Lz-DApp React Native!

To compile and run your project in development, execute one of the following commands:
- ${getScriptCommandString(ctx, `ios`)}
- ${getScriptCommandString(ctx, `android`)}
- ${getScriptCommandString(ctx, `web`)}

  `.trim();
};

export const create = async (params: createParams): Promise<createResult> => {
  createBaseProject(params);

  const ctx = await createBaseContext(params);

  if (!fs.existsSync(ctx.projectDir)) {
    return Object.freeze({
      ...ctx,
      status: CreationStatus.FAILURE,
      message: `Failed to resolve project directory.`,
    });
  }

  setAppIcon(ctx);
  injectShims(ctx);
  createScripts(ctx);
  preparePackage(ctx);
  shouldPrepareMetro(ctx);
  shouldPrepareBabel(ctx);
  shouldPrepareEslint(ctx);
  shouldPrepareTypeRoots(ctx);
  shouldPrepareSpelling(ctx);
  shouldPrepareTsc(ctx);
  shouldPrepareGitignore(ctx);
  shouldWriteEnv(ctx);
  shouldWriteConfigJS(ctx);
  shouldInstall(ctx);
  shouldPrepareExample(ctx);

  return Object.freeze({
    ...ctx,
    status: CreationStatus.SUCCESS,
    message: getSuccessMessage(ctx),
  });
};
