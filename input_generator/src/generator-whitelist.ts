import { Input } from './schema-in'
import {
  transformBlocks,
  transformBlocksToPublicBlocks,
  transformWhitelist
} from './transformers'
import {
  Account,
  Block,
  Count,
  PublicBlock,
  Whitelist
} from './schema-out'
import { ZoKNumber } from './ZoKNumber'

/**
 * The result of an input generation for the whitelist audit program.
 *
 * @remarks
 * The array elements in order:
 *   1. The sequence of blocks under audit, padded with dummy block data
 *      at the end.
 *   2. The number of blocks that should actually be considered from the
 *      previous element.  Equal to the length of the previous element
 *      minus the number of dummy blocks that were used for padding.
 *   3. The public data corresponding to the blocks in the previous
 *      element, which is used for commitment to the real ledger state.
 *   4. The list of accounts that are whitelisted, ie allowed to receive
 *      funds via transactions.  This list is also padded by dummy
 *      accounts at the end to match the constant size expected by
 *      ZoKrates.
 *   5. The number of items that should actually be considered from the
 *      whitelist.  Equal to the length of the previous element
 *      minus the number of dummy accounts that were used for padding.
 */
export type Output = [Block[], PublicBlock[], Count, Whitelist, Count]

/**
 * Arguments required to generate the input for the whitelist audit
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
   * The total whitelist length (including padding/dummy accounts) the
   * audit program expects.
   *
   * @see constant `W_` in the ZoKrates programs.
   */
  whitelistAccounts: number
}

/**
 * Generate audit input data for the **whitelist** audit type.
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
    whitelistAccounts
  }: Arguments
): Output {
  const [outBlocks, blockCount]: [Block[], number] =
    transformBlocks(
      data.blocks,
      addresses,
      blocks,
      transactionsPerBlock
    )

  const [whitelist, whitelistCount]: [Account[], number] =
    transformWhitelist(data.whitelist, whitelistAccounts, addresses)

  return [
    outBlocks,
    transformBlocksToPublicBlocks(outBlocks),
    new ZoKNumber(blockCount).toString(),
    whitelist,
    new ZoKNumber(whitelistCount).toString()
  ]
}
