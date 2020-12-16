const fs = require('fs/promises');

const TMP_DIR = process.platform === 'linux' ? '/tmp' : '';
const TARGET_DIR =
  process.platform === 'linux'
    ? '~/Documents'
    : process.env.USERPROFILE + '\\Documents';

async function elo() {
  await fs.readFile();
}
