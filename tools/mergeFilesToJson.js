const pkcsParser = require('./../src/app/digipass/pkcsParser');
const fs = require('fs');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const parseAndValidateArgs = () => {
  const args = {
    pkcsPath: null,
    unlockPath: null,
    decryptKey: null,
    outPath: null,
  };

  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];
    const eqIndex = arg.indexOf('=');
    if (eqIndex > 0) {
      const key = arg.substr(0, eqIndex);
      const value = arg.substr(eqIndex + 1);
      switch (key) {
        case '--pkcs':
        case '-p':
          args.pkcsPath = value;
          break;
        case '--unlock':
        case '-u':
          args.unlockPath = value;
          break;
        case '--key':
        case '-k':
          args.decryptKey = value;
          break;
        case '--out':
        case '-o':
          args.outPath = value;
          break;
      }
    }
  }

  if (!args.pkcsPath) {
    throw new Error('Must include pkcsPath (-p, --pkcs)');
  }
  if (!args.unlockPath) {
    throw new Error('Must include unlockPath (-u, --unlock)');
  }
  if (!args.decryptKey) {
    throw new Error('Must include decryptKey (-p, --key)');
  }
  if (!args.outPath) {
    throw new Error('Must include outPath (-o, --out)');
  }

  return args;
};
const readAndUnpackPkcsFile = async (pkcsPath, decryptionKey) => {
  const xml = await readFile(pkcsPath, 'utf8');
  return pkcsParser.parser(xml, decryptionKey);
};
const readAndUnpackUnlockFile = async (unlockPath) => {
  const csv = await readFile(unlockPath, 'utf8');
  const rows = csv.split(/\r?\n/);
  return rows.map((row) => {
    const cols = row.split(',');
    return {
      serialNumber: cols[0],
      unlock1: cols[1],
      unlock2: cols[2],
    };
  });
};

const merge = async () => {
  const args = parseAndValidateArgs();
  const devices = await readAndUnpackPkcsFile(args.pkcsPath, args.decryptKey);
  const unlockCodes = await readAndUnpackUnlockFile(args.unlockPath);

  for (let i = 0; i < devices.length; i += 1) {
    const device = devices[i];
    const deviceUnlockCodes = unlockCodes.find(x => x.serialNumber === device.serialNumber);
    if (deviceUnlockCodes) {
      device.unlock1 = deviceUnlockCodes.unlock1;
      device.unlock2 = deviceUnlockCodes.unlock2;
    }
  }

  await writeFile(args.outPath, JSON.stringify(devices), 'utf8');

  return args.outPath;
};

merge()
  .then((outputPath) => {
    console.log(`Saved to ${outputPath}`);
  })
  .catch((e) => {
    console.error(e.message);
  });