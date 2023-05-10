/*
 * Copyright 2023 Contributors the the zkp-audit-zokrates repository
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you
 * may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
 * implied.  See the License for the specific language governing
 * permissions and limitations under the License.
 */

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
   *
   * @param n - The original number
   * @returns The {@link ZoKNumber} made from `n`
   */
  constructor (n: number) {
    this.num = n
  }

  /**
   * Convert this into a 8x32 (= 256) bit number format consumable by
   * ZoKrates (an 8-long array of strings).
   *
   * @returns The number represented by `this` {@link ZoKNumber} but
   *          split into an 8-long array.
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
   *
   * @return This {@link ZoKNumber} as ZoKrates expects it
   */
  public toString (): ZoKNumberType {
    return this.num.toString()
  }
}
