import Promise from 'bluebird';
import models from '../models';

export default (config) => {
  console.log('[db] Connecting database');
  const userPass = config.mongo.user && config.mongo.pass ? `${config.mongo.user}:${config.mongo.pass}@` : '';
  const hostProperty = [].concat(config.mongo.host);
  const portProperty = [].concat(config.mongo.port);
  const hosts = hostProperty.reduce((s, h, i) => `${s}${i > 0 ? ',' : ''}${h}:${portProperty[i] || portProperty[0]}`, '');
  const uri = `mongodb://${userPass}${hosts}/${config.mongo.dataBaseName}`;
  const options = config.mongo.options || {};

  if (process.env.NODE_ENV !== 'test') {
    return (models as any).connect(uri, options);
  }

  return Promise.resolve();
};
