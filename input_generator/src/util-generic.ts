/**
 * Arguments required by the padToLenght function.
 */
export interface PadToLengthArgs {
  /** The array of actual elements. */
  array: any[]
  /** The lenght to which to pad the array. */
  length: number
  /** The dummy element with which padding should be done. */
  padWith: any | any[]
  /** Whether to pad before or after the actual array. */
  padKind: PadKind
}

/**
 * Types of padding.
 *
 * @remarks
 * Either we pad `BEFORE` the actual array (so that the real elements
 * are at the end) or `AFTER`.
 */
export enum PadKind { BEFORE, AFTER }

/**
 * Prefix all elements of a string array with `0x`.
 *
 * @example
 * ```js
 * prefixAllWith0x(['ab', 'cd', 'ff']) === ['0xab', '0xcd', '0xff']
 * ```
 *
 * @param arr - The array whose elements to prefix
 * @returns `arr` with each element prefixed by `0x`
 */
export function prefixAllWith0x (arr: string[]): string[] {
  return arr.map(e => '0x' + e)
}

/**
 * Remove the `0x` prefix of a hexadecimal string.
 *
 * @example
 * ```js
 * remove0xPrefix('0xDEADBEEF') === 'DEADBEEF'
 * ```
 *
 * @param s - The string whose `0x` prefix should be removed
 * @returns `s` but without its `0x` prefix
 */
export function remove0xPrefix (s: string): string {
  return s.slice(2)
}

/**
 * Split a string every **eight** characters into an array.
 *
 * @example
 * ```js
 * splitEvery8Chars('ABCDEFGHIJKLMNOP') === ['ABCDEFGH', 'IJKLMNOP']
 * ```
 *
 * @param s - The string to split
 * @returns `s` split into an array of 8-long (sub)strings
 */
export function splitEvery8Chars (s: string): string[] {
  return splitEveryNChars(s, 8)
}

/**
 * Convert a number to a 32-bit long hexadecimally encoded string.
 *
 * @example
 * ```js
 * numberToHexString(15) === '0000000f'
 * numberToHexString(912) === '00000390'
 * ```
 *
 * @param n - The number to convert
 * @returns `n` represented as a 32-bit hexadecimal
 */
export function numberToHexString (n: number): string {
  const buf = Buffer.alloc(4)
  buf.writeInt32BE(n)
  return buf.toString('hex')
}

/**
 * Pad an array to a specific lenght, either by prepending or appending
 * filling elements, which are also specified as a parameter.
 *
 * @remarks
 * If the filling element specified is an array, filling happens by
 * appending (or prepending) the array over and over until it does not
 * fit into the desired length any more.  At that point, a truncated
 * version of the filling array is used.
 *
 * @example
 * For example, padding a the array `[A, B, C]` to a length of `16` with
 * `[1, 2, 3, 4]`, using the `AFTER` pad kind gives you:
 *
 * ```
 * [A, B, C, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1]
 * ```
 *
 * @param arguments - Refer to {@link PadToLengthArgs}
 * @returns The padded array
 */
export function padToLength ({
  array,
  length,
  padWith,
  padKind
}: PadToLengthArgs): any[] {
  const toFill: number = length - array.length
  let padding: any[]
  if (Array.isArray(padWith)) {
    const timesItFits: number = Math.floor(toFill / padWith.length)
    const remainingLength: number = toFill % padWith.length
    padding = [
      ...Array(timesItFits).fill(padWith).flat(),
      ...padWith.slice(0, remainingLength)
    ]
  } else {
    padding = Array(toFill).fill(padWith)
  }

  switch (padKind) {
    case PadKind.BEFORE:
      return [...padding, ...array]
    case PadKind.AFTER:
      return [...array, ...padding]
  }
}

/**
 * Get the reverse of a string.
 *
 * @example
 * ```js
 * reverseString('abcde') === 'edcba'
 * ```
 *
 * @param s - The string to reverse
 * @returns `s` but with its characters in reverse order
 */
export function reverseString (s: string): string {
  return Array.from(s).reverse().join('')
}

/**
 * Get an array of integers from `start' to `end' (excluding `end').
 *
 * @remarks
 * If no `start' parameter is specified, zero is assumed.
 *
 * @example
 * ```js
 * range(3, 6) === [3, 4, 5]
 * ```
 *
 * @see Python’s `range` function
 *
 * @param end - The end of the range (exclusive)
 * @param start - Where to start the range
 * @returns An array of integers from `start` to `end`
 */
export function range (end: number, start: number = 0): number[] {
  return Array.from(Array(end - start), (_, k: number) => k + start)
}

function splitEveryNChars (s: string, n: number): string[] {
  return s.match(new RegExp(`.{1,${n}}`, 'g')) ?? []
}
