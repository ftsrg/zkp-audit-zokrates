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
 * passed as a parameter
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
 * Calculate the previousHash field of the next block, which is the hash
 * of the concatenation of the fields of the current block's header (ie
 * of the previous hash value and the current block's transactions'
 * Merkle tree's root)
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
 */
export function hashTransaction (tx: Transaction): lib.WordArray {
  return SHA256(enc.Hex.parse(stringifyTransactionForHashing(tx)))
}

/**
 * Stringify a transaction so that its hash can be calculated.
 *
 * This is done by simply concatenating the source-destiation-triple
 * values that define the transaction and prepending a sufficient amount
 * of zeroes so that the result is a 4-long array of u32[8] arrays.
 *
 * For example, the following transaction
 *
 *   [0x00d7b92a,0xec4093dd,0x1994262b,0xf85d7235,0x0f616a9c]  (from)
 *     --[0,0,0,0,0,0,0,100]-->                                (amount)
 *   [0x117b3909,0x75488a3b,0x0b78767c,0x9a498d6d,0xb296cad3]  (to)
 *
 * Becomes
 *
 * 0000000000000000000000000000000000000000000000000000000000000000↵  (zeroes)
 * 00000000000000000000000000000000000000000000000000d7b92aec4093dd↵  (padding ⧺ from[0..2])
 * 1994262bf85d72350f616a9c117b390975488a3b0b78767c9a498d6db296cad3↵  (from[3..4] ⧺ to)
 * 0000000000000000000000000000000000000000000000000000000000000064   (amount)
 *
 *
 * The first line of zeroes is necessary because
 * hashes/sha256/1024bitPadded in the ZoKrates standard library expects
 * four u32[8] arrays as its input.  A u32[8] array translates to 64
 * exadecimal characters (AKA 32 bytes = 8 × 32 bits).
 */
function stringifyTransactionForHashing (
  { source, destination, amount }: Transaction
): string {
  /*
   * Explanation of magic numbers 8, 6, and the 00000000:
   *   * eight zeroes (00000000) correspond to a unit of 4 bytes or
   *     32 bits (u32)
   *   * first, stringified transactions always start with 64 = 8 x 8
   *     zeroes
   *   * secondly, only the last 2 x 8 = 16 characters of the second 256
   *     characters of the transaction string are useful, the rest must
   *     be padded by 64 - 16 = 6 x 8 =  zeroes
   */
  return [
    ...Array(8 + 6).fill('00000000'),
    ...source.map(p => remove0xPrefix(p)),
    ...destination.map(p => remove0xPrefix(p)),
    ...amount.map(p => numberToHexString(parseInt(p)))
  ].join('')
}
