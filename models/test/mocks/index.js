const provider = require('./provider');
const account = require('./account');
const clientInvoice = require('./clientinvoice');
const deliveryorder = require('./deliveryorder');
const product = require('./product');
const invoice = require('./invoice');

module.exports = {
  ...provider,
  ...account,
  ...clientInvoice,
  ...deliveryorder,
  ...product,
  ...invoice,
};
