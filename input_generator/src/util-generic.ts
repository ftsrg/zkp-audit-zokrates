/**
 * Arguments required by the padToLenght function.
 */
export interface PadToLengthArgs {
  /** The array of actual elements */
  array: any[]
  /** The lenght to pad the array to */
  length: number
  /** The dummy element used to pad with */
  padWith: any
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
 * filling elements, which are also specified as a parameter
 */
export function padToLength ({
  array,
  length,
  padWith,
  padKind
}: PadToLengthArgs): any[] {
  switch (padKind) {
    case PadKind.BEFORE:
      return [...Array(length - array.length).fill(padWith), ...array]
    case PadKind.AFTER:
      return [...array, ...Array(length - array.length).fill(padWith)]
  }
}

function splitEveryNChars (s: string, n: number): string[] {
  return s.match(new RegExp(`.{1,${n}}`, 'g')) ?? []
}

export function reverseString (s: string): string {
  return Array.from(s).reverse().join('')
}
