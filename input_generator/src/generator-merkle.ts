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

import { Block as IBlock, Input } from './schema-in'
import { transformTransactions } from './transformers'
import { Account, Hash, SplitHex, Transaction } from './schema-out'
import { calculateMerkleTreeRoot } from './util-hashing'

/**
 * The result of an input generation for the merkle audit program.
 *
 * @remarks
 * The array elements in order:
 *   1. The list of transactions under audit, padded with dummy
 *      transaction data at the end.  The next element should be equal
 *      to the root of the Merkle-tree formed by these items.
 *   2. The root of the Merkle-tree formed by the previous element, ie
 *      the transactions.  This is a (SHA256) hash.
 */
export type Output = [Transaction[], Hash]

/**
 * Arguments required to generate the input for the merkle audit
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
   * The total number of transactions (including padding/dummy ones) the
   * audit program expects each block to have.
   *
   * @see constant `M_` in the ZoKrates programs.
   */
  transactionsPerBlock: number
  /**
   * The index of the block to consider from the ones provided in the
   * `data` field.
   *
   * @remark
   * The merkle audit program can only handle a single block at a time.
   */
  blockIndex: number
}

/**
 * Generate audit input data for the **merkle** audit type.
 *
 * @param arguments - The {@link Arguments} passed by the user.
 * @returns The output data structure that can be stringified as a JSON
 *          and fed into the ZoKrates programs.
 */
export function generate (
  {
    data,
    addresses,
    transactionsPerBlock,
    blockIndex
  }: Arguments
): Output {
  const inputBlock: IBlock | undefined = data.blocks[blockIndex]
  if (inputBlock === undefined) {
    throw new Error(
      `Block index ${blockIndex} out of range;` +
      'trying to generate Merkle tree'
    )
  }
  const [txs, _txCount]: [Transaction[], number] =
    transformTransactions(
      inputBlock,
      transactionsPerBlock,
      addresses
    )

  const root: SplitHex = calculateMerkleTreeRoot(txs)

  return [txs, root]
}
