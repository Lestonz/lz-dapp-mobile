#!/usr/bin/env node

import chalk from 'chalk';
import prompts from 'prompts';

import { create } from '../main';
import { CreationStatus } from '../types';

const defaultPadding = 5;

const line = (message: string, padding: number = defaultPadding) =>
  console.log([...Array(padding)].map(() => ' ').join(''), message);

const gfx = `

  /$$       /$$$$$$$$  /$$$$$$  /$$$$$$$$/$$$$$$  /$$   /$$ /$$$$$$$$
| $$      | $$_____/ /$$__  $$|__  $$__/$$__  $$| $$$ | $$|_____ $$ 
| $$      | $$      | $$  |__/   | $$ | $$  | $$| $$$$| $$     /$$/ 
| $$      | $$$$$   |  $$$$$$    | $$ | $$  | $$| $$ $$ $$    /$$/  
| $$      | $$__/    |____  $$   | $$ | $$  | $$| $$  $$$$   /$$/   
| $$      | $$       /$$  | $$   | $$ | $$  | $$| $$|  $$$  /$$/    
| $$$$$$$$| $$$$$$$$|  $$$$$$/   | $$ |  $$$$$$/| $$ |  $$ /$$$$$$$$
|________/|________/ |______/    |__/  |______/ |__/  |__/|________/


`.trim();


function validateUriScheme(value: string): boolean {
  return /^[a-z0-9]+$/.test(value);
}

(async () => {
  console.clear();
  console.log();
  gfx.split('\n').map((e) => line(e, 1));
  console.log();

  line(chalk.green.bold`Hello developer,`);
  line(chalk.green.bold`Lestonz is here, don't worry!`);
  line(chalk.green.bold`Visit to lestonz.com`); 
  console.log();
  line(chalk.red.bgWhite.bold`Don't forget to follow me on Social Media :)`);
  console.log();
  line(chalk.green.bold`Let's Start react-native-lz-dapp-v2!`);


  console.log();

  const {
    name,
    uriScheme,
  } = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'What is your lz-dapp name?',
      initial: 'react-native-lz-dapp-v2',
      validate: (value) => {
        if (typeof value !== 'string') {
          return `Expected string, encountered ${typeof value}.`;
        } else if (!value.length) {
          return 'Name cannot be empty.';
        } else if (!value.match(/^[a-z0-9-]+$/i)) {
          return 'Name must be alphanumeric and contain no special characters other than a hyphen.';
        } else if (/^\d/.test(value)) {
          return 'Name cannot begin with a number.';
        } else if (/^-/.test(value)) {
          return 'Name cannot begin with a hyphen.';
        }
        return true;
      },
    },
    {
      type: 'text',
      name: 'uriScheme',
      message: 'What is the URI scheme?',
      initial: 'reactnative',
      validate: (value) => {
        if (!validateUriScheme(value)) {
          return `Only lowercase alphanumeric characters are allowed.`;
        }
        return true;
      },
    },
  ]);

  const { status, message } = await create({
    name,
    uriScheme,
  });

  if (status === CreationStatus.FAILURE) {
    throw new Error(message);
  }
  console.log(message);
  console.log();
})();
