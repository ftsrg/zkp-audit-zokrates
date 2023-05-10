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

import { Input } from './schema-in'
import { generate as generateMerkle } from './generator-merkle'
import { generate as generateWhitelist } from './generator-whitelist'
import { generate as generateBalances } from './generator-balances'
import { Account, Output } from './schema-out'

/**
 * The list of known audit types.
 */
export const AuditTypes = ['balances', 'whitelist', 'merkle']

/**
 * The list of known audit types.
 */
export type AuditType = typeof AuditTypes[number]

/**
 * Arguments required to generate the input for any audit program.
 */
export interface Arguments {
  /**
   * The total number of blocks (including padding/dummy ones) the audit
   * program expects
   *
   * @see constant `N_` in the ZoKrates programs.
   */
  totalBlocks: number
  /**
   * The total number of transactions (including padding/dummy ones) the
   * audit program expects each block to have.
   *
   * @see constant `M_` in the ZoKrates programs.
   */
  totalTransactionsPerBlock: number
  /**
   * The total number of accounts (including padding/dummy ones) the
   * audit program expects.
   *
   * @see constant `B_` in the ZoKrates programs.
   */
  totalAccounts: number
  /**
   * The total whitelist length (including padding/dummy accounts) the
   * audit program expects.
   *
   * @see constant `W_` in the ZoKrates programs.
   */
  totalWhitelistLength: number
  /**
   * The index of the block to consider from the ones provided in the
   * `data` field.
   *
   * @remark
   * The merkle audit program can only handle a single block at a time.
   */
  merkleBlockIndex: number
}

/**
 * Generate audit input data for the given audit type from some input
 * data.
 *
 * @param arguments - The {@link Arguments} passed by the user.
 * @returns The output data structure that can be stringified as a JSON
 *          and fed into the ZoKrates programs.
 */
export function generate (
  type: AuditType,
  data: Input,
  addresses: Account[],
  {
    totalBlocks,
    totalTransactionsPerBlock,
    totalAccounts,
    totalWhitelistLength,
    merkleBlockIndex
  }: Arguments
): Output {
  switch (type) {
    case 'balances':
      return generateBalances({
        data,
        addresses,
        blocks: totalBlocks,
        transactionsPerBlock: totalTransactionsPerBlock,
        accounts: totalAccounts
      })
    case 'whitelist':
      return generateWhitelist({
        data,
        addresses,
        blocks: totalBlocks,
        transactionsPerBlock: totalTransactionsPerBlock,
        whitelistAccounts: totalWhitelistLength
      })
    case 'merkle':
      return generateMerkle({
        data,
        addresses,
        transactionsPerBlock: totalTransactionsPerBlock,
        blockIndex: merkleBlockIndex
      })
    default:
      throw new Error(`Unknown audit type: ${type}`)
  }
}
