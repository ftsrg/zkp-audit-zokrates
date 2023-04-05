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
 */
function stringifyTransactionForHashing (
  { source, destination, amount }: Transaction
): string {
  return [
    ...Array(8 + 6).fill('00000000'), // ??? magic numbers
    ...source.map(p => remove0xPrefix(p)),
    ...destination.map(p => remove0xPrefix(p)),
    ...amount.map(p => numberToHexString(parseInt(p)))
  ].join('')
}
