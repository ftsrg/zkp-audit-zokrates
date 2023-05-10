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
import {
  transformBalances,
  transformBlocks,
  transformBlocksToPublicBlocks
} from './transformers'
import {
  Account,
  Balance,
  Block,
  Count,
  PublicBlock
} from './schema-out'
import { ZoKNumber } from './ZoKNumber'

/**
 * The result of an input generation for the balances audit program.
 *
 * @remarks
 * The array elements in order:
 *   1. The initial balances of all the accounts that appear in the
 *      ledger.  This is either the balance at genesis or the balances
 *      that were valid just before the first block that is audited in
 *      this session.
 *   2. The sequence of blocks under audit, padded with dummy block data
 *      at the end.
 *   3. The public data corresponding to the blocks in the previous
 *      element, which is used for commitment to the real ledger state.
 *   4. The number of blocks that should actually be considered from the
 *      previous element.  Equal to the length of the previous element
 *      minus the number of dummy blocks that were used for padding.
 */
export type Output = [Balance[], Block[], PublicBlock[], Count]

/**
 * Arguments required to generate the input for the balances audit
 * program.
 */
export interface Arguments {
  /** The simplified ledger data structure. */
  data: Input
  /**
   * The hexadecimal accounts to which simple numeric account
   * identifiers should be mapped.
   */
  addresses: Account[]
  /**
   * The total number of blocks (including padding/dummy ones) the audit
   * program expects
   *
   * @see constant `N_` in the ZoKrates programs.
   */
  blocks: number
  /**
   * The total number of transactions (including padding/dummy ones) the
   * audit program expects each block to have.
   *
   * @see constant `M_` in the ZoKrates programs.
   */
  transactionsPerBlock: number
  /**
   * The total number of accounts (including padding/dummy ones) the
   * audit program expects.
   *
   * @see constant `B_` in the ZoKrates programs.
   */
  accounts: number
}

/**
 * Generate audit input data for the **balances** audit type.
 *
 * @param arguments - The {@link Arguments} passed by the user.
 * @returns The output data structure that can be stringified as a JSON
 *          and fed into the ZoKrates programs.
 */
export function generate (
  {
    data,
    addresses,
    blocks,
    transactionsPerBlock,
    accounts
  }: Arguments
): Output {
  const [bals, _balCount]: [Balance[], number] =
    transformBalances(data.balances, accounts, addresses)

  const [outBlocks, blockCount]: [Block[], number] =
    transformBlocks(
      data.blocks,
      addresses,
      blocks,
      transactionsPerBlock
    )

  return [
    bals,
    outBlocks,
    transformBlocksToPublicBlocks(outBlocks),
    new ZoKNumber(blockCount).toString()
  ]
}
