// The deploy client and host must sign exactly the same bytes.
export function canonicalJson(value) {
  const active = new WeakSet();
  const encode = (item) => {
    if (item === null || typeof item === 'string' || typeof item === 'boolean') {
      return JSON.stringify(item);
    }
    if (typeof item === 'number' && Number.isFinite(item)) return JSON.stringify(item);
    if (typeof item !== 'object' || item === null) throw new TypeError('not representable in JSON');
    if (active.has(item)) throw new TypeError('cyclic value is not representable in JSON');
    const array = Array.isArray(item);
    const prototype = Object.getPrototypeOf(item);
    if (!array && prototype !== null && Object.getPrototypeOf(prototype) !== null) {
      throw new TypeError('only arrays and plain objects are representable in JSON');
    }
    active.add(item);
    try {
      if (array) return `[${Array.from(item, encode).join(',')}]`;
      const fields = [];
      for (const key of Object.keys(item).sort()) {
        const field = item[key];
        if (field !== undefined) fields.push(`${JSON.stringify(key)}:${encode(field)}`);
      }
      return `{${fields.join(',')}}`;
    } finally {
      active.delete(item);
    }
  };
  return encode(value);
}
