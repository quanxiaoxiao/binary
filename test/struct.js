const test = require('ava');
const compose = require('../src/compose');
const struct = require('../src/struct');

test('set data to name', (t) => {
  const buf = compose()
    .chars('name', 'quan')
    .addLength8()();
  t.throws(() => {
    struct(buf)
      .int8('nameLength')
      .chars('data', (d) => d.nameLength)();
  });
});

test('pass', (t) => {
  const buf = compose()
    .chars('name', 'quan')
    .addLength8()();
  let ret = struct(buf)
    .int8('nameLength')
    .chars('name', (d) => d.nameLength)();
  t.is(ret.name, 'quan');
  t.is(ret.nameLength, 'quan'.length);
  t.is(ret.data.length, 0);
  t.throws(() => {
    struct(buf)
      .int8('nameLength')
      .chars('name', (d) => d.nameLength + 1)();
  });

  ret = struct(buf)
    .int8('nameLength')
    .chars('name', 0)();
  t.is(ret.name, '');
  t.is(ret.data.toString(), 'quan');
});
