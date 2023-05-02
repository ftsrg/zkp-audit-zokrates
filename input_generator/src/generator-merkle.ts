import { Block as IBlock, Input } from './schema-in'
import { transformTransactions } from './transformers'
import { Account, Hash, SplitHex, Transaction } from './schema-out'
import { calculateMerkleTreeRoot } from './util-hashing'

/**
 * The result of an input generation for the merkle audit program.
 *
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
  /** The simplified ledger data structure */
  data: Input
  /**
   * The hexadecimal accounts map simple numeric account identifiers to
   */
  addresses: Account[]
  /**
   * The total number of transactions (including padding/dummy ones) the
   * audit program expects each block to have (-> constant M_)
   */
  transactionsPerBlock: number
  /**
   * The index of the block to consider from the ones provided in the
   * data parameter.  The merkle audit program can only handle a single
   * block at a time.
   */
  blockIndex: number
}

/**
 * Generate audit input data for the merkle audit type.
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
