import fs from 'fs'
import { prefixAllWith0x, splitEvery8Chars } from './util-generic'
import {
  numberToSplitZoKNumber,
  numberToZoKNumber
} from './util-zokrates'
import { Account, Block, Hash, Transaction } from './schema-out'

const dummyAddressString = '0000000000000000000000000000000000000000'

function splitAddress (a: string): Account {
  return prefixAllWith0x(splitEvery8Chars(a))
}

export const dummyAddress: Account = splitAddress(dummyAddressString)

export function getAddresses (file: string): Account[] {
  const addressStrings: string[] =
    JSON.parse(fs.readFileSync(file, 'utf8'))
  return addressStrings.map(a => splitAddress(a))
}

export const zeroZoKNumber = numberToZoKNumber(0)
export const zeroSplitZoKNumber = numberToSplitZoKNumber(0)

export const zeroHash: Hash = Array(8).fill('0')
export const zeroAccount: Account = Array(5).fill('0')

const dummyTransaction: Transaction = {
  source: zeroAccount,
  destination: zeroAccount,
  amount: zeroSplitZoKNumber
}

/**
 * Generate a dummy (empty) block
 */
export function getDummyBlock (transactionsPerBlock: number): Block {
  return {
    prevHash: zeroHash,
    transactions: Array(transactionsPerBlock).fill(dummyTransaction),
    transactionCount: zeroZoKNumber
  }
}
