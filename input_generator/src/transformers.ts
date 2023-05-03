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
  prefixAllWith0x,
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
 * format.
 *
 * @param data - The balances specified in the input data
 * @param totalAccounts - The total number of accounts expected by the
 *                        ZoKrates program (see constant `B_` in
 *                        ZoKrates)
 * @param addresses - The array of Ethereum-like addresses to which
 *                    accounts in `data` should be mapped
 * @returns A ‘tuple’ of the generated output balances list and the
 *          count of actually useful balances within it (excluding
 *          dummy/padding ones)
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
 * ZoKrates-parsable format.
 *
 * @param data - The blocks specified in the input data
 * @param addresses - The array of Ethereum-like addresses to which
 *                    accounts in `data` should be mapped
 * @param totalBlocks - The total number of blocks expected by the
 *                        ZoKrates program (see constant `N_` in
 *                        ZoKrates)
 * @param totalTransactionsPerBlock - The total number of transactions
 *                                    per block expected by the ZoKrates
 *                                    program (see constant `M_` in
 *                                    ZoKrates)
 * @returns A ‘tuple’ of the generated output block list and the count
 *          of actually useful blocks within it (excluding dummy/padding
 *          ones)
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
 * format.
 *
 * @param data - The transactions specified in the input data
 * @param totalTransactionsPerBlock - The total number of transactions
 *                                    per block expected by the ZoKrates
 *                                    program (see constant `M_` in
 *                                    ZoKrates)
 * @param addresses - The array of Ethereum-like addresses to which
 *                    accounts in `data` should be mapped
 * @returns A ‘tuple’ of the generated output transaction list and the
 *          count of actually useful transactions within it (excluding
 *          dummy/padding ones)
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
      padWithIsArray: true,
      padKind: PadKind.AFTER
    }),
    txs.length
  ]
}

/**
 * Transform input data containing whitelisted accounts to
 * ZoKrates-parsable format.
 *
 * @param whitelist - The whitelist specified in the input data
 * @param whitelistAccounts - The total length of the whitelist expected
 *                            by the ZoKrates program (see constant `W_`
 *                            in ZoKrates)
 * @param addresses - The array of Ethereum-like addresses to which
 *                    accounts in `data` should be mapped
 * @returns A ‘tuple’ of the generated output whitelist and the count of
 *          actually useful elements within it (excluding dummy/padding
 *          ones)
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
 *
 * @param blocks - The real blocks to ‘sanitize’
 * @returns The public data related to `blocks`
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
    prefixAllWith0x(splitEvery8Chars(hashTransaction(t).toString())))
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
