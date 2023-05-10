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

import fs from 'fs'
import {
  prefixAllWith0x,
  range,
  splitEvery8Chars
} from './util-generic'
import { Account, Block, Hash, Transaction } from './schema-out'
import { ZoKNumber } from './ZoKNumber'

const dummyAddressString = '0000000000000000000000000000000000000000'
const empty32BitHexadecimal = '0x00000000'

/**
 * An empty address to be used in dummy/padding transactions.
 */
export const dummyAddress: Account = splitAddress(dummyAddressString)

/**
 * An empty/zeroed hash value to be used in dummy/padding blocks.
 *
 * @remarks
 * Note that the value of each u32[8] element cannot simply be '0'
 * because ZoKrates will not hash the transaction as expected in that
 * case.
 */
export const zeroHash: Hash = Array(8).fill(empty32BitHexadecimal)

/**
 * An empty/zeroed account identifier to be used in dummy/padding
 * transactions.
 *
 * @remarks
 * Note that the value of each u32[8] element cannot simply be '0'
 * because ZoKrates will not hash the transaction as expected in that
 * case.
 */
export const zeroAccount: Account = Array(5).fill(empty32BitHexadecimal)

/**
 * Read ethereum-style addresses from a file.
 *
 * @param file - The file to read the addresses from
 * @returns The list of accounts read from `file`
 */
export function getAddresses (file: string): Account[] {
  const addressStrings: string[] =
    JSON.parse(fs.readFileSync(file, 'utf8'))
  return addressStrings.map(a => splitAddress(a))
}

/**
 * Generate a dummy (empty) transaction.
 *
 * @remarks
 * Even dummy transactions have indices to ensure every leaf in the
 * Merkle-tree built from transactions is unique.  Hence the `index`
 * parameter.
 *
 * @see {@link getDummyBlock} for the function that generates an entire
 * dummy _block._
 *
 * @param index - The index field to use in the dummy transaction
 * @returns The dummy transaction
 */
export function getDummyTransaction (index: number): Transaction {
  return {
    index: new ZoKNumber(index).toString(),
    source: zeroAccount,
    destination: zeroAccount,
    amount: ZoKNumber.ZERO.split()
  }
}

/**
 * Generate a dummy (empty) block.
 *
 * @see {@link getDummyTransaction} for how dummy transactions are added
 * to the block.
 *
 * @param transactionsPerBlock - How many (dummy) transactions there
 *                               should be within the block
 * @returns The dummy block
 */
export function getDummyBlock (transactionsPerBlock: number): Block {
  return {
    prevHash: zeroHash,
    transactions:
      range(transactionsPerBlock)
        .map((i: number) => getDummyTransaction(i)),
    transactionCount: ZoKNumber.ZERO.toString()
  }
}

function splitAddress (a: string): Account {
  return prefixAllWith0x(splitEvery8Chars(a))
}
