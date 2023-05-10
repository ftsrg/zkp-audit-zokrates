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

import { Output as BalancesOutput } from './generator-balances'
import { Output as WhitelistOutput } from './generator-whitelist'
import { Output as MerkleOutput } from './generator-merkle'

/* ---------------------------------------------------------------- *
 *   GENERATOR REEXPORTS                                            *
 * ---------------------------------------------------------------- */

/**
 * The generic result of an input generation.
 *
 * @remarks
 * Will match the output schema of one of the generators.
 */
export type Output = BalancesOutput | WhitelistOutput | MerkleOutput

export type { Output as BalancesOutput } from './generator-balances'
export type { Output as WhitelistOutput } from './generator-whitelist'
export type { Output as MerkleOutput } from './generator-merkle'

/* ---------------------------------------------------------------- *
 *   DOMAIN-SPECIFIC                                                *
 * ---------------------------------------------------------------- */

/**
 * Represents a block in the ledger.
 */
export interface Block {
  /** The hash of the header of the previous block. */
  prevHash: Hash
  /** The transactions inside this block, including dummy ones. */
  transactions: Transaction[]
  /**
  * The actual number of transactions.
  *
  * @remarks
  * Should be the lenght of the `transactions` field minus the number of
  * padding/dummy transactions.
  */
  transactionCount: ZoKNumber
}

/**
 * The public data regarding a block in the ledger.
 *
 * @remarks
 * Does not contain any plain text information about the block, only
 * hashes.  This is used for commitment to the real blockchain state.
 */
export interface PublicBlock {
  /** The hash of the header of the previous block. */
  prevHash: Hash
  /** The hashes of the transactions within this block. */
  hashes: Hash[]
  /**
  * The actual number of transactions.
  *
  * @remarks
  * Should be the lenght of the `transactions` field minus the number of
  * padding/dummy transactions.
  */
  transactionCount: ZoKNumber
}

/**
 * Represents a single transaction.
 */
export interface Transaction {
  /*
   * Index of the transaction within the block.
   *
   * @remarks
   * Indexing starts at zero.
   */
  index: ZoKNumber
  /** The sending party. */
  source: Account
  /** The receiving party. */
  destination: Account
  /**
   * The amount of funds that were transferred from the `source` to the
   * `destination` address.
   */
  amount: SplitZoKNumber
}

/**
 * Reprensents the (initial) balance of a single account.
 */
export type Balance = [Account, SplitZoKNumber]

/**
 * Represents a whitelist of accounts; i.e., those that are allowed to
 * receive funds via transactions.
 */
export type Whitelist = Account[]

/**
 * Represents a single account on the blockchain.
 */
export type Account = SplitHex

/* ---------------------------------------------------------------- *
 *   ZOKRATES-SPECIFIC                                              *
 * ---------------------------------------------------------------- */

/**
 * A simple number as ZoKrates expects it as an input (stringified).
 */
export type ZoKNumber = string

/**
 * A number that exceeds the maximum size that ZoKrates can handle and
 * is therefore represented as an array of `ZoKNumber`s.
 */
export type SplitZoKNumber = ZoKNumber[]

/* ---------------------------------------------------------------- *
 *   LOW-LEVEL                                                      *
 * ---------------------------------------------------------------- */

/**
 * A hash of something; e.g., the SHA256 hash of a block header.
 */
export type Hash = SplitHex

/**
 * Represents a count of something, such as the number of non-dummy
 * transactions within a block.
 */
export type Count = ZoKNumber

/**
 * A stringified hexadecimal number, split into several parts.
 *
 * @remarks
 * Each part should be individually prefixed by a `0x` prefix.  For
 * example, `['0xDEADBEEF', '0x12341234']` should be interpreted as the
 * hexadecimal number `0xDEADBEEF12341234`, which is actually
 * `16045690981402808884` in decimal.
 */
export type SplitHex = string[]
