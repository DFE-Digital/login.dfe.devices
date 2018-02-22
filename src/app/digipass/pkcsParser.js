const xmlParser = require('xml2js').parseString;
const bodyReader = require('body');
const crypto = require('crypto');
const base32 = require('thirty-two');
const config = require('./../../infrastructure/config');

const decrypt = (cipherCase64, key) => {
  const cipher = Buffer.from(cipherCase64, 'base64')
  const iv = cipher.slice(0, 16);
  const data = cipher.slice(16);

  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  const pt1 = decipher.update(data);
  const pt2 = decipher.final();
  if (pt1.length > 0 && pt2.length > 0) {
    return Buffer.concat([pt1, pt2]);
  } else if (pt2.length > 0) {
    return pt2;
  }

  return pt1;
};
const xmlRemoveNamespacePrefix = (name) => {
  const match = name.match(/(.*)\:(.*)/);
  if (match && match.length > 1) {
    return match[2];
  }
  return name;
};
const extractXml = (req) => {
  return new Promise((resolve, reject) => {
    bodyReader(req, (err, xml) => {
      if (err) {
        reject(err);
      } else {
        resolve(xml);
      }
    });
  });
};
const parseXml = (xml) => {
  return new Promise((resolve, reject) => {
    xmlParser(xml, {
      explicitArray: false,
      tagNameProcessors: [xmlRemoveNamespacePrefix],
    }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};
const convertXmlToDevicesModel = (xmlDoc, pkcsKey) => {
  const keyPackages = xmlDoc.KeyContainer.KeyPackage instanceof Array ? xmlDoc.KeyContainer.KeyPackage : [xmlDoc.KeyContainer.KeyPackage];
  const key = Buffer.from(pkcsKey, 'hex');

  return keyPackages.map((keyPackage) => {
    const decryptedSecret = decrypt(keyPackage.Key.Data.Secret.EncryptedValue.CipherData.CipherValue, key);
    const decryptedCounter = decrypt(keyPackage.Key.Data.Counter.EncryptedValue.CipherData.CipherValue, key);
    return {
      serialNumber: keyPackage.DeviceInfo.SerialNo,
      secret: base32.encode(decryptedSecret).toString('utf8'),
      counter: decryptedCounter.readInt32BE(0),
      unlock1: '',
      unlock2: '',
    };
  });
};


const parse = async (xml, pkcsKey) => {
  const xmlDoc = await parseXml(xml);
  return convertXmlToDevicesModel(xmlDoc, pkcsKey);
};

const middleware = async (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.toLowerCase() === 'application/x-pkcs12') {
    const xml = await extractXml(req);
    const devices = await parse(xml, config.devices.digipass.pkcsKey);

    if (!req.body) {
      req.body = {};
    }
    req.body.devices = devices;
  }
  next();
};
middleware.parser = parse;

module.exports = middleware;