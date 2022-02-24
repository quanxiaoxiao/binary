import test from 'ava';
import compose from '../src/compose.mjs';
import struct from '../src/struct.mjs';

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

  ret = struct(buf)
    .int8('nameLength')
    .chars('name', 0)();
  t.is(ret.name, '');
  t.is(ret.data.toString(), 'quan');
});
