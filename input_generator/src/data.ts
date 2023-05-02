import fs from 'fs'
import {
  prefixAllWith0x,
  range,
  splitEvery8Chars
} from './util-generic'
import {
  numberToSplitZoKNumber,
  numberToZoKNumber
} from './util-zokrates'
import { Account, Block, Hash, Transaction } from './schema-out'

const dummyAddressString = '0000000000000000000000000000000000000000'
const empty32BitHexadecimal = '0x00000000'

/**
 * An empty address to be used in dummy/padding transactions.
 */
export const dummyAddress: Account = splitAddress(dummyAddressString)

/**
 * The ZoKNumber of 0.
 */
export const zeroZoKNumber = numberToZoKNumber(0)

/**
 * The SplitZoKNumber of 0.
 */
export const zeroSplitZoKNumber = numberToSplitZoKNumber(0)

/**
 * An empty/zeroed hash value to be used in dummy/padding blocks.
 *
 * Note that the value of each u32[8] element cannot simply be '0'
 * because ZoKrates will not hash the transaction as expected in that
 * case.
 */
export const zeroHash: Hash = Array(8).fill(empty32BitHexadecimal)

/**
 * An empty/zeroed account identifier to be used in dummy/padding
 * transactions.
 *
 * Note that the value of each u32[8] element cannot simply be '0'
 * because ZoKrates will not hash the transaction as expected in that
 * case.
 */
export const zeroAccount: Account = Array(5).fill(empty32BitHexadecimal)

/**
 * Read ethereum-style addresses from a file.
 */
export function getAddresses (file: string): Account[] {
  const addressStrings: string[] =
    JSON.parse(fs.readFileSync(file, 'utf8'))
  return addressStrings.map(a => splitAddress(a))
}

/**
 * Generate a dummy (empty) transaction
 */
export function getDummyTransaction (index: number): Transaction {
  return {
      index: numberToZoKNumber(index),
      source: zeroAccount,
      destination: zeroAccount,
      amount: zeroSplitZoKNumber
  }
}

/**
 * Generate a dummy (empty) block
 */
export function getDummyBlock (transactionsPerBlock: number): Block {
  return {
    prevHash: zeroHash,
    transactions:
      range(transactionsPerBlock)
        .map((i: number) => getDummyTransaction(i)),
    transactionCount: zeroZoKNumber
  }
}

function splitAddress (a: string): Account {
  return prefixAllWith0x(splitEvery8Chars(a))
}
