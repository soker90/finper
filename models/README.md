# Arroyo Erp Models

![GitHub](https://img.shields.io/github/license/soker90/arroyo-erp-models)
[![npm version](https://badge.fury.io/js/arroyo-erp-models.svg)](https://badge.fury.io/js/arroyo-erp-models)
![](https://github.com/soker90/arroyo-erp-models/workflows/Node.js%20CI/badge.svg)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=soker90_arroyo-erp-models&metric=alert_status)](https://sonarcloud.io/dashboard?id=soker90_arroyo-erp-models)
[![codecov](https://codecov.io/gh/soker90/arroyo-erp-models/branch/master/graph/badge.svg)](https://codecov.io/gh/soker90/arroyo-erp-models)

This is a module of models for Arroyo ERP.

## Installation

```bash
  npm install arroyo-erp-models --save
```

## Cambios en la versión

Ver [CHANGELOG](https://github.com/soker90/arroyo-erp-models/blob/master/CHANGELOG.md)

## Available models

```javascript
  import models from 'arroyo-erp-models';

  models.mongoose // Expose a mongoose instance to connect
  models.connect() // Expose a method to connect to mongoose and response with the connection

  models.AccountModel // Expose a Account model with its statics & methods
  models.AutoIncrement // Expose a AutoIncrement model with its statics & methods
  models.BillingModel // Expose a Billing model with its statics & methods
  models.ClientModel // Expose a Client model with its statics & methods
  models.ClientInvoiceModel // Expose a Client ClientInvoice model with its statics & methods
  models.DeliveryOrderModel // Expose a Delivery Order model with its statics & methods
  models.InvoiceModel // Expose a ClientInvoice model with its statics & methods
  models.NoteModel // Expose a Note model with its statics & methods
  models.PaymentModel // Expose a Payment model with its statics & methods
  models.PriceModel // Expose a Price model with its statics & methods
  models.PriceChangeModel // Expose a Price Change model with its statics & methods
  models.ProductService // Expose a Product model with its statics & methods
  models.ProviderService // Expose a Provider model with its statics & methods

```

