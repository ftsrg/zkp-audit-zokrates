import fs from 'fs'
import { Balances, Input, Transaction, prettyFormat } from './schema-in'

/**
 * Parse an input file.
 */
export function parse (inputFile: string | number): Input {
  return JSON.parse(fs.readFileSync(inputFile, 'utf8')) as Input
}

/**
 * Validate the contents of an input file.
 *
 * This checks whether an input file is actually correct without having
 * to run the ZoKrates programs on the transformed version of it.  It
 * verifies that in all transactions...
 *  a) the source has sufficient balance
 *  b) the sender is whitelisted
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
