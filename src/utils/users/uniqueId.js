const { createHmac } = require('node:crypto');

const generateUniqId = (textString) => {
  return createHmac('sha1', textString).digest('hex');
}

module.exports = {
  generateUniqId
}

