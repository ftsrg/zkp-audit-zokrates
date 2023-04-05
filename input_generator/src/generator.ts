import { Input } from './schema-in'
import { generate as generateMerkle } from './generator-merkle'
import { generate as generateWhitelist } from './generator-whitelist'
import { generate as generateBalances } from './generator-balances'
import { Account, Output } from './schema-out'

export const AuditTypes = ['balances', 'whitelist', 'merkle']
export type AuditType = typeof AuditTypes[number]

export interface Arguments {
  totalBlocks: number
  totalTransactionsPerBlock: number
  totalAccounts: number
  totalWhitelistLength: number
  merkleBlockIndex: number
}

/**
 * Generate audit input data for the given audit type from some input
 * data
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
