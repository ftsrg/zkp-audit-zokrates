import {
  padToLength,
  splitEvery8Chars,
  reverseString,
  PadKind
} from './util-generic'
import { SplitZoKNumber, ZoKNumber } from './schema-out'

const zokNumberLength = 8
const zerostring = '0'

/**
 * Convert a number into a 8x32 (= 256) bit number format consumable by
 * ZoKrates (an 8-long array of strings)
 */

export function numberToSplitZoKNumber (n: number): SplitZoKNumber {
  return padToLength({
    array: splitEvery8Chars(reverseString(n.toString(16)))
      .map(p => '0x' + reverseString(p))
      .map(p => parseInt(p, 16).toString())
      .reverse(),
    length: zokNumberLength,
    padWith: zerostring,
    padKind: PadKind.BEFORE
  })
}

/**
 * Convert a number into a format consumable by ZoKrates (ie a string)
 */
export function numberToZoKNumber (n: number): ZoKNumber {
  return n.toString()
}
