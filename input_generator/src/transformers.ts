import {
  Account as IAccount,
  Balances as IBalances,
  Block as IBlock,
  Transaction as ITransaction,
  Whitelist as IWhitelist,
  prettyFormat
} from './schema-in'
import {
  Account as OAccount,
  Balance as OBalance,
  Block as OBlock,
  Hash,
  PublicBlock as OPublicBlock,
  Transaction as OTransaction,
  Whitelist as OWhitelist,
  ZoKNumber as OZoKNumber
} from './schema-out'
import {
  dummyAddress,
  getDummyBlock,
  getDummyTransaction,
  zeroHash
} from './data'
import {
  PadKind,
  padToLength,
  range,
  splitEvery8Chars
} from './util-generic'
import {
  calculateMerkleTreeRoot,
  calculateNextBlockHash,
  hashTransaction
} from './util-hashing'
import { ZoKNumber } from './ZoKNumber'

/**
 * Transform input data containing account balances to ZoKrates-parsable
 * format
 */
export function transformBalances (
  data: IBalances,
  totalAccounts: number,
  addresses: OAccount[]
): [OBalance[], number] {
  /* Map numeric accounts to full addresses and encode numbers */
  const bals: OBalance[] = []
  let acc, bal: string
  for ([acc, bal] of Object.entries(data)) {
    const balNum: number = parseInt(bal)
    const addr: OAccount = mustGetAddress(
      addresses, parseInt(acc),
      `setting balance of ${acc} to ${balNum}`
    )
    bals.push([addr, new ZoKNumber(balNum).split()])
  }

  /* Return balances array padded with dummy elements */
  return [
    padToLength({
      array: bals,
      length: totalAccounts,
      padWith: [dummyAddress, ZoKNumber.ZERO.split()],
      padKind: PadKind.AFTER
    }),
    bals.length
  ]
}

/**
 * Transform input data containing block/transaction information to
 * ZoKrates-parsable format
 */
export function transformBlocks (
  data: IBlock[],
  addresses: OAccount[],
  totalBlocks: number,
  totalTransactionsPerBlock: number
): [OBlock[], number] {
  const blks: OBlock[] = []

  /*
   * Iterate over all input blocks and create the output blocks while
   * also keeping track of hashes
   */
  let prevHash: Hash = zeroHash
  let b: IBlock
  for (b of data) {
    const [txs, txCount]: [OTransaction[], number] =
      transformTransactions(b, totalTransactionsPerBlock, addresses)

    const blk: OBlock = {
      prevHash,
      transactions: txs,
      transactionCount: new ZoKNumber(txCount).toString()
    }

    prevHash = calculateNextBlockHash(
      prevHash,
      calculateMerkleTreeRoot(txs)
    )

    blks.push(blk)
  }

  /* Return output block array padded by dummy blocks */
  return [
    padToLength({
      array: blks,
      length: totalBlocks,
      padWith: getDummyBlock(totalTransactionsPerBlock),
      padKind: PadKind.AFTER
    }),
    blks.length
  ]
}

/**
 * Transform input data containing transactions to ZoKrates-parsable
 * format
 */
export function transformTransactions (
  data: ITransaction[],
  totalTransactionsPerBlock: number,
  addresses: OAccount[]
): [OTransaction[], number] {
  /*
   * Map list of input transactions to a list of output transactions,
   * mapping account numbers to addresses and formatting numbers as
   * required by ZoKrates
   */
  const txs: OTransaction[] = data.map((t: ITransaction, i: number) => {
    const index: OZoKNumber = new ZoKNumber(i).toString()
    const source: OAccount = mustGetAddress(
      addresses,
      t.source,
      `processing transaction ${prettyFormat(t)}`
    )
    const destination: OAccount = mustGetAddress(
      addresses,
      t.destination,
      `processing transaction ${prettyFormat(t)}`
    )
    const amount = new ZoKNumber(t.amount).split()

    return ({ index, source, destination, amount })
  })

  /*
   * Return the output transaction array, padded by dummy transactions
   * at the end
   */
  return [
    padToLength({
      array: txs,
      length: totalTransactionsPerBlock,
      padWith:
        range(
          totalTransactionsPerBlock,
          txs.length
        ).map((i: number) => getDummyTransaction(i)),
      padKind: PadKind.AFTER
    }),
    txs.length
  ]
}

/**
 * Transform input data containing whitelisted accounts to
 * ZoKrates-parsable format
 */
export function transformWhitelist (
  whitelist: IWhitelist,
  whitelistAccounts: number,
  addresses: OAccount[]
): [OWhitelist, number] {
  /* Build whitelist by mapping numeric accounts to addresses */
  const wl: OWhitelist = whitelist.map((acc: IAccount) => {
    const addr: OAccount = mustGetAddress(
      addresses, acc,
      'building whitelist'
    )
    return addr
  })

  /* Return whitelist padded by dummy addresses */
  return [
    padToLength({
      array: wl,
      length: whitelistAccounts,
      padWith: dummyAddress,
      padKind: PadKind.AFTER
    }),
    wl.length
  ]
}

/**
 * Map an sequence of blocks to their corresponding public blocks, which
 * contain only non-sensitive data.
 */
export function transformBlocksToPublicBlocks (
  blocks: OBlock[]
): OPublicBlock[] {
  return blocks.map((b: OBlock) => ({
    prevHash: b.prevHash,
    hashes: mapTransactionsToHashes(b.transactions),
    transactionCount: b.transactionCount
  }))
}

function mapTransactionsToHashes (txs: OTransaction[]): Hash[] {
  return txs.map((t: OTransaction) =>
    splitEvery8Chars(hashTransaction(t).toString()))
}

function mustGetAddress (
  addresses: OAccount[],
  account: number,
  message?: string
): OAccount {
  const addr: OAccount | undefined = addresses[account]
  if (addr === undefined) {
    let msg = `Account index ${account} out of range`
    if (message !== undefined) {
      msg = msg.concat(`; ${message}`)
    }
    throw new Error(msg)
  }

  return addr
}
