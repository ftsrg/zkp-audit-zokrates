import {
  ZoKNumber as ZoKNumberType,
  SplitZoKNumber
} from './schema-out'
import {
  PadKind,
  padToLength,
  reverseString,
  splitEvery8Chars
} from './util-generic'

/**
 * Represents a number as understood by ZoKrates.
 *
 * Yes, the fact that this inherits from String is a hack, but it makes
 * its usage much easier.
 */
export class ZoKNumber {
  private static readonly LENGTH = 8
  private readonly num: number

  /**
   * The ZoKNumber of zero value, for convenience.
   */
  public static readonly ZERO = new ZoKNumber(0)

  /**
   * Create a new ZoKNumber from any actual number.
   */
  constructor (n: number) {
    this.num = n
  }

  /**
    * Convert this into a 8x32 (= 256) bit number format consumable by
    * ZoKrates (an 8-long array of strings)
    */
  public split (): SplitZoKNumber {
    return padToLength({
      array: splitEvery8Chars(reverseString(this.num.toString(16)))
        .map(p => '0x' + reverseString(p))
        .map(p => parseInt(p, 16).toString())
        .reverse(),
      length: ZoKNumber.LENGTH,
      padWith: '0',
      padKind: PadKind.BEFORE
    })
  }

  /**
   * Get the string representation of this number (a string, as ZoKrates
   * expects).
   */
  public toString (): ZoKNumberType {
    return this.num.toString()
  }
}
