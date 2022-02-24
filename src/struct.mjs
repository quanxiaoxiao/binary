import assert from 'node:assert';

export default (chunk) => {
  let buf = chunk;
  const store = {};

  const getBufSize = (size) => {
    const len = typeof size === 'function' ? size(store, buf) : size;
    assert.ok(typeof len === 'number');
    return len;
  };

  const set = ({
    name,
    size,
    match,
    fn,
  }, type) => {
    assert.ok(['skip', 'hex', 'utf-8', 'buffer', 'number', 'set'].includes(type) && name !== 'data' && !store[name]);
    const len = getBufSize(size);
    if (len === 0) {
      if (type !== 'skip') {
        if (type === 'set') {
          store[name] = fn(store, Buffer.from([]));
        } else if (type === 'buffer') {
          store[name] = Buffer.from([]);
        } else if (type === 'number') {
          store[name] = 0;
        } else {
          store[name] = '';
        }
      }
    } else {
      const dataBuf = buf.slice(0, len);
      if (type !== 'skip') {
        if (type === 'set') {
          store[name] = fn(store, buf.slice(0, len));
        } else if (type === 'buffer') {
          store[name] = dataBuf;
        } else if (type === 'number') {
          store[name] = size === 64 ? buf.readBigInt64BE(0, size) : buf.readUIntBE(0, size);
        } else {
          store[name] = buf.slice(0, len).toString(type);
        }
      }
      buf = buf.slice(len);
    }
    if (match) {
      assert.ok(match(store[name]));
    }
  };

  const struct = () => ({
    ...store,
    data: buf,
  });

  struct.set = (name, size, fn) => {
    set({
      name,
      size,
      fn,
    }, 'set');
    return struct;
  };

  struct.skip = (size, match) => {
    set({
      name: '$$skip',
      size,
      match,
    }, 'skip');
    return struct;
  };

  struct.hex = (name, size, match) => {
    set({
      name,
      size,
      match,
    }, 'hex');
    return struct;
  };

  struct.chars = (name, size, match) => {
    set({
      name,
      size,
      match,
    }, 'utf-8');
    return struct;
  };

  struct.buf = (name, size, match) => {
    set({
      name,
      size,
      match,
    }, 'buffer');
    return struct;
  };

  struct.int8 = (name, match) => {
    set({
      name,
      match,
      size: 1,
    }, 'number');
    return struct;
  };

  struct.int16 = (name, match) => {
    set({
      name,
      match,
      size: 2,
    }, 'number');
    return struct;
  };

  struct.int24 = (name, match) => {
    set({
      name,
      match,
      size: 3,
    }, 'number');
    return struct;
  };

  struct.int32 = (name, size, match) => {
    set({
      name,
      size: 4,
      match,
    }, 'number');
    return struct;
  };

  struct.int64 = (name, size, match) => {
    set({
      name,
      size: 64,
      match,
    }, 'number');
    return struct;
  };

  struct.tap = (fn) => {
    fn(chunk.slice(0, chunk.length - buf.length));
    return struct;
  };

  struct.trim = () => {
    let padLen = 0;
    if (buf.slice(-1).toString('hex') === '00') {
      padLen = 1;
    } else if (/(0[0-9a-f])(\1)+$/.test(buf.slice(-16).toString('hex'))) {
      padLen = parseInt(RegExp.$1, 16) + 1;
    }
    if (padLen !== 0) {
      buf = buf.slice(0, buf.length - padLen);
    }
    return struct;
  };

  struct.get = (name) => {
    if (name == null) {
      return store;
    }
    return store[name];
  };

  struct.payload = (payloadLengthName = 'length') => {
    const payloadLength = store[payloadLengthName];
    assert.ok(typeof payloadLength === 'number' && buf.length === payloadLength);
    struct.buf('payload', payloadLength);
    return struct.final();
  };

  struct.final = () => {
    assert.ok(buf.length === 0);
    return store;
  };

  return struct;
};
