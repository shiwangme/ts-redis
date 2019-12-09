import should from 'should';
import redis from '../src';

test('all config', () => {
  const client = redis({
    db: 1
  });
  should(client).be.an.Object();
});

test('default config', () => {
  const client = redis();
  should(client).be.an.Object();
});

test('default config', () => {
  const client = redis();
  should(client).be.an.Object();
});
