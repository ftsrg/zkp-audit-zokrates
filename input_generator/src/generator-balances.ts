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
  /** The simplified ledger data structure */
  data: Input
  /**
   * The hexadecimal accounts map simple numeric account identifiers to
   */
  addresses: Account[]
  /**
   * The total number of blocks (including padding/dummy ones) the audit
   * program expects (-> constant N_)
   */
  blocks: number
  /**
   * The total number of transactions (including padding/dummy ones) the
   * audit program expects each block to have (-> constant M_)
   */
  transactionsPerBlock: number
  /**
   * The total number of accounts (including padding/dummy ones) the
   * audit program expects (-> constant B_)
   */
  accounts: number
}

/**
 * Generate audit input data for the balances audit type
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
