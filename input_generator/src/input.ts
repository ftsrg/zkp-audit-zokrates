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
import { Balances, Input, Transaction, prettyFormat } from './schema-in'

/**
 * Parse an input file.
 *
 * @param inputFile - The file to read and parse
 * @returns The input data structure obtained from `inputFile`
 */
export function parse (inputFile: string | number): Input {
  return JSON.parse(fs.readFileSync(inputFile, 'utf8')) as Input
}

/**
 * Validate the contents of an input file.
 *
 * @remarks
 * This checks whether an input file is actually correct without having
 * to run the ZoKrates programs on the transformed version of it.  It
 * verifies that in all transactions...
 *  a) the source has sufficient balance
 *  b) the sender is whitelisted
 *
 * @param inputFile - The file to read and parse
 * @param verbose - Whether to print additional debugging information
 * @returns `true` if `inputFile` passes validation; `false` otherwise
 */
export function validate (
  inputFile: string | number,
  verbose: boolean = false
): boolean {
  const input: Input = parse(inputFile)
  const balanceStates = new Map<number, Balances>([[0, input.balances]])

  let step = 0
  let tx: Transaction
  for (tx of input.blocks.flat()) {
    const balances: Balances | undefined =
      { ...balanceStates.get(step) }
    if (balances === undefined) {
      throw new Error('fatal error')
    }

    if (verbose) {
      console.error(
        `Processing transaction #${step}: ${prettyFormat(tx)}`
      )
    }

    /* Check source balance */
    const sourceBalance: number | undefined = balances[tx.source]
    if (sourceBalance === undefined) {
      throw new Error(`Transaction #${step} source out of range`)
    }
    if (sourceBalance < tx.amount) {
      console.error(`Transaction #${step}: insufficient source balance`)
      return false
    }

    /* Check destination whitelistedness */
    if (!input.whitelist.includes(tx.destination)) {
      console.error(`Transaction #${step}: forbidden destination`)
      return false
    }

    balances[tx.source] -= tx.amount
    balances[tx.destination] += tx.amount
    ++step
    balanceStates.set(step, balances)
  }

  if (verbose) {
    console.error('\n\nSTATES:\n')
    balanceStates.forEach((bals: Balances, step: number) => {
      console.error(`${step})\t${JSON.stringify(bals)}`)
    })
  }

  return true
}
