const test = require('ava');
const compose = require('../src/compose');

test('chars', (t) => {
  const buf = compose()
    .chars('name', 'quan')();
  t.true(Buffer.from('quan', 'utf-8').equals(buf));
});

test('hex', (t) => {
  const hex = '11212321acb';
  const buf = compose()
    .hex('name', hex)();
  t.true(Buffer.from(hex, 'hex').equals(buf));
});
