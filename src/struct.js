const assert = require('assert');

module.exports = (chunk) => {
  let buf = chunk;
  const data = {};

  const getBufSize = (size) => {
    const len = typeof size === 'function' ? size(data, buf) : size;
    assert.ok(typeof len === 'number');
    return len;
  };

  const set = ({
    name,
    size,
    match,
  }, type) => {
    assert.ok(['skip', 'hex', 'utf-8', 'buffer', 'number'].includes(type) && name !== 'data' && !data[name]);
    const len = getBufSize(size);
    assert.ok(len <= buf.length);
    if (len === 0) {
      if (type !== 'skip') {
        if (type === 'buffer') {
          data[name] = Buffer.from([]);
        } else if (type === 'number') {
          data[name] = 0;
        } else {
          data[name] = '';
        }
      }
    } else {
      const dataBuf = buf.slice(0, len);
      if (type !== 'skip') {
        if (type === 'buffer') {
          data[name] = dataBuf;
        } else if (type === 'number') {
          data[name] = buf.readUIntBE(0, size);
        } else {
          data[name] = buf.slice(0, len).toString(type);
        }
      }
      buf = buf.slice(len);
    }
    if (match) {
      assert.ok(match(data[name]));
    }
  };

  const struct = () => ({
    ...data,
    data: buf,
  });

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
      return data;
    }
    return data[name];
  };

  struct.payload = (payloadLengthName = 'length') => {
    const payloadLength = data[payloadLengthName];
    assert.ok(typeof payloadLength === 'number' && buf.length === payloadLength);
    struct.buf('payload', payloadLength);
    return struct.final();
  };

  struct.final = () => {
    assert.ok(buf.length === 0);
    return data;
  };

  return struct;
};
