/**
 * Arguments required by the padToLenght function.
 */
export interface PadToLengthArgs {
  /** The array of actual elements */
  array: any[]
  /** The lenght to pad the array to */
  length: number
  /** The dummy element used to pad with */
  padWith: any | any[]
  /** Whether to pad before or after the actual array */
  padKind: PadKind
}

export enum PadKind { BEFORE, AFTER }

/**
 * Prefix all elements of a string array with 0x
 */
export function prefixAllWith0x (arr: string[]): string[] {
  return arr.map(e => '0x' + e)
}

/**
 * Remove the 0x prefix of a hexadecimal string
 */
export function remove0xPrefix (s: string): string {
  return s.slice(2)
}

/**
 * Split a string every eight characters into an array
 */
export function splitEvery8Chars (s: string): string[] {
  return splitEveryNChars(s, 8)
}

/**
 * Convert a number to a 32-bit long hexadecimally encoded string
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
 * If the filling element specified is an array, filling happens by
 * appending (or prepending) the array over and over until it does not
 * fit into the desired length any more.  At that point, a truncated
 * version of the filling array is used.
 *
 * For example, padding a the array [A, B, C] to a length of 16 with
 * [1, 2, 3, 4], using the AFTER pad kind gives you:
 *
 *   [A, B, C, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1]
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

function splitEveryNChars (s: string, n: number): string[] {
  return s.match(new RegExp(`.{1,${n}}`, 'g')) ?? []
}

/**
 * Get the reverse of a string.
 *
 * For example, 'abcde' becomes 'edcba'.
 */
export function reverseString (s: string): string {
  return Array.from(s).reverse().join('')
}

/**
 * Get an array of integers from `start' to `end' (excluding `end').
 *
 * For example, range(3, 6) = [3, 4, 5].
 * If no `start' parameter is specified, zero is assumed.
 */
export function range (end: number, start: number = 0): number[] {
  return Array.from(Array(end - start), (_, k: number) => k + start)
}
