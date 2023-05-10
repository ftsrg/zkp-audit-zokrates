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

import MerkleTree from 'merkletreejs'
import { SHA256, lib, enc } from 'crypto-js'
import {
  numberToHexString,
  prefixAllWith0x,
  remove0xPrefix,
  splitEvery8Chars
} from './util-generic'
import { Hash, Transaction } from './schema-out'

/**
 * Calculate the root of the Merkle tree formed by the transactions
 * passed as a parameter.
 *
 * @param transactions - The transactions to build the tree from
 * @returns The root of the Merkle-tree built from `transactions`
 */
export function calculateMerkleTreeRoot (
  transactions: Transaction[]
): Hash {
  const tree = new MerkleTree(
    transactions.map((t: Transaction) => hashTransaction(t))
  )
  const root: string = tree.getRoot().toString('hex')
  return prefixAllWith0x(splitEvery8Chars(root))
}

/**
 * Calculate the previousHash field of the next block.
 *
 * @remarks
 * The result is the hash of the concatenation of the fields of the
 * current block's header (i.e., of the previous hash value (`previous`)
 * and the current block's transactions' Merkle-tree's root
 * (`thisRoot`)).
 *
 * @param previous - The hash of the previous block’s header
 * @param thisRoot - The root of the Merkle-tree of this block’s
 *                   transactions
 * @returns The hash value to put into the next block’s header
 */
export function calculateNextBlockHash (
  previous: Hash,
  thisRoot: Hash
): Hash {
  return prefixAllWith0x(
    splitEvery8Chars(
      SHA256(
        enc.Hex.parse(previous.concat(thisRoot).join(''))
      ).toString(enc.Hex)
    )
  )
}

/**
 * Calculate the SHA256 hash of a transaction.
 *
 * @param tx - The transaction whose hash to compute
 * @returns The hash of `tx`
 */
export function hashTransaction (tx: Transaction): lib.WordArray {
  return SHA256(enc.Hex.parse(stringifyTransactionForHashing(tx)))
}

/**
 * Stringify a transaction so that its hash can be calculated.
 *
 * @remarks
 * This is done by simply concatenating the source-destiation-triple
 * values that define the transaction and prepending a sufficient amount
 * of zeroes so that the result is a 4-long array of u32[8] arrays.
 *
 * @example
 * For example, the following transaction
 *
 * ```
 * (4)                                                       (index)
 * [0x00d7b92a,0xec4093dd,0x1994262b,0xf85d7235,0x0f616a9c]  (from)
 *   --[0,0,0,0,0,0,0,100]-->                                (amount)
 * [0x117b3909,0x75488a3b,0x0b78767c,0x9a498d6d,0xb296cad3]  (to)
 * ```
 *
 * Becomes
 * 
 * ```
 * 0000000000000000000000000000000000000000000000000000000000000000↵  (zeroes)
 * 00000000000000000000000000000000000000000000000400d7b92aec4093dd↵  (padding ⧺ index ⧺ from[0..2])
 * 1994262bf85d72350f616a9c117b390975488a3b0b78767c9a498d6db296cad3↵  (from[3..4] ⧺ to)
 * 0000000000000000000000000000000000000000000000000000000000000064   (amount)
 * ```
 *
 * The first line of zeroes is necessary because
 * `hashes/sha256/1024bitPadded` in the ZoKrates standard library expects
 * four `u32[8]` arrays as its input.  A `u32[8]` array translates to 64
 * hexadecimal characters (AKA 32 bytes = 8 × 32 bits).
 *
 * @param transaction - The transaction to stringify
 * @returns The (padded) stringification of `transaction`
 */
function stringifyTransactionForHashing (
  { index, source, destination, amount }: Transaction
): string {
  /*
   * Explanation of magic numbers 8, 6, and the 00000000:
   *   * eight zeroes (00000000) correspond to a unit of 4 bytes or
   *     32 bits (u32)
   *   * first, stringified transactions always start with 64 = 8 x 8
   *     zeroes
   *   * secondly, only the last 3 x 8 = 24 characters of the second 256
   *     characters of the transaction string are useful, the rest must
   *     be padded by 64 - 24 = 40 = 5 x 8 zeroes
   */
  return [
    ...Array(8 + 5).fill('00000000'),
    numberToHexString(parseInt(index)),
    ...source.map(p => remove0xPrefix(p)),
    ...destination.map(p => remove0xPrefix(p)),
    ...amount.map(p => numberToHexString(parseInt(p)))
  ].join('')
}
