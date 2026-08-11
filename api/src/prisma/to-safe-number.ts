export function toSafeNumber(value: bigint) {
  const number = Number(value);

  if (!Number.isSafeInteger(number)) {
    throw new RangeError(`${value} exceeds JavaScript's safe integer range`);
  }

  return number;
}
