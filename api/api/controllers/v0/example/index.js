const { authMiddleware } = require('../../../../src/components/auth');
const errorHandler = require('../../../../src/components/error-handlers');

const ExampleController = require('./example.controller');

module.exports = ({ exampleService }, { exampleValidator }, { exampleAdapter }) => {
  const exampleController = new ExampleController({
    errorHandler,
    exampleService,
    exampleValidator,
    exampleAdapter,
  });

  return [{
    method: 'get',
    domain: 'examples',
    path: '/',
    handler: exampleController.examples,
    bindTo: exampleController,
    skipVersion: true,
  }, {
    method: 'get',
    domain: 'examples',
    path: '/:id',
    handler: exampleController.example,
    bindTo: exampleController,
    skipVersion: true,
    middlewares: [
      authMiddleware,
    ],
  }];
};
