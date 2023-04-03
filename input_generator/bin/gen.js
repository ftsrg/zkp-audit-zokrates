import fs from 'fs'
import yargs from 'yargs'
import { Hex } from 'crypto-js/enc-hex'
import { MerkleTree } from 'merkletreejs'
import { SHA256 } from 'crypto-js/sha256'

/****************************************************************
 *      HELPERS                                                 *
 ****************************************************************/

/* A string representing zero. */
const ZEROSTR = '0'

/*
 * Split a string every 8 characters.
 */
function split8 (string) {
  return string.match(/.{1,8}/g)
}

/*
 * Prefix all elements of a string array with '0x'.
 */
function prefixWith0x (arr) {
  return arr.map(s => '0x' + s)
}

/*
 * Expand a simple number into a stringified u32[8] array for ZoKrates.
 */
function expandNumber (number) {
  const revstr = s => Array.from(s).reverse().join('')
  const parts = split8(revstr(number.toString(16)))
    .map(p => '0x' + revstr(p))
    .map(p => parseInt(p, 16).toString())
    .reverse()

  return [...Array(8 - parts.length).fill(ZEROSTR), ...parts]
}

/****************************************************************
 *      CONSTANTS                                               *
 ****************************************************************/

const dummyAddressOriginal = '0000000000000000000000000000000000000000'
const addressesOriginal = [
  '00d7b92aec4093dd1994262bf85d72350f616a9c',
  '117b390975488a3b0b78767c9a498d6db296cad3',
  '2253e0a69100d2e30dc1557b24c425d46e0563d6',
  '33a5277b649b3ad11c90c224be7c542f8a6d9a23',
  '445851125b058edc674fca2eb22668ec7e1d0fe9',
  '5515a4c05a074c226fcab8775b8dc930eaf2741a',
  '66b87890fa0a7dba21e573f5461f5872fdc4ad49',
  '77293cc1e2cc2853c9b704a2cb411c00e9bc2b59',
  '88f87e520305728ddb098f14ae32f137e8ced839',
  '99aff8eeacb535966c8a6d546bf6bcb05604c47d',
  'aa3bf5d2fe11f8d65a3e977dc713c3347604cbe5',
  'bb106c7134c9e06c0b8a6771042b749cdf04c759',
  'cc6831e3f77ed2a2125e8525ebf4fee1587deb32',
  'dd73c9cb45e6c8ac50f5240404b48f2a575de768',
  'ee870023dbd50e039bbdb709b6c5edbcc2b76142',
  'ffd00efdb947a4c93d5ca4f2d5c916565a0baace'
]

const splitAddress = a => prefixWith0x(split8(a))

const dummyAddress = splitAddress(dummyAddressOriginal)
const addresses = addressesOriginal.map(a => splitAddress(a))

/****************************************************************
 *      MAIN FUNCTIONS                                          *
 ****************************************************************/

/*
 * Transform simple balances input `input_bals' to conform with the
 * balances audit program.
 */
function transformBalances (inputBalances, totalAccounts) {
  const bals = Object.entries(inputBalances).map(([acc, bal]) => [
    addresses[acc], expandNumber(bal)
  ])
  bals.push(...Array(totalAccounts - bals.length).fill([
    dummyAddress, expandNumber(ZEROSTR)
  ]))

  return bals
}

/*
 * Transform simple transactions input `input_txs' to conform with the
 * audit programs.
 */
function transformTransactions (inputTransactions, totalTransactions) {
  const transactions = inputTransactions.map(t => ({
    source: addresses[t.source],
    destination: addresses[t.destination],
    amount: expandNumber(t.amount)
  }))
  const txCount = transactions.length
  transactions.push(...Array(totalTransactions - txCount).fill({
    source: dummyAddress,
    destination: dummyAddress,
    amount: expandNumber(ZEROSTR)
  }))

  return { transactions, txCount }
}

/*
 * Transform simple blocks input `input_blks' to conform with the
 * balances and whitelist audit programs.
 */
function transformBlocks (inputBlocks, totalBlocks, totalTransactions) {
  const blocks = inputBlocks.map(
    b => transformTransactions(b, totalTransactions)
  )
  const blockCount = blocks.length
  blocks.push(...Array(totalBlocks - blockCount).fill({
    transactions: Array(argv.m).fill({
      source: dummyAddress,
      destination: dummyAddress,
      amount: expandNumber(ZEROSTR)
    }),
    n_transactions: ZEROSTR
  }))

  return { blks: blocks, blockCount: blockCount.toString() }
}

/*
 * Transform simple whitelist input `input_wl' to conform with the
 * whitelist audit program.
 */
function transformWhitelist (inputWhitelist, totalEntries) {
  const wl = inputWhitelist.map(a => addresses[a])
  const wlCount = wl.length
  wl.push(...Array(totalEntries - wlCount).fill(dummyAddress))

  return { whitelist: wl, n_whitelist: wlCount.toString() }
}

/*
 * Calculate the Merkle-tree root for simple array of
 * transactions `input_txs'.
 */
function calculateRoot (inputTransactions) {
  const int2hex = x => {
    const buf = Buffer.alloc(4)
    buf.writeInt32BE(x)
    return buf.toString('hex')
  }
  const remove0x = x => x.slice(2)

  const padTx = t => [
    ...Array(8 + 6).fill('00000000'),
    ...t.source.map(p => remove0x(p)),
    ...t.destination.map(p => remove0x(p)),
    ...t.amount.map(p => int2hex(p))
  ].join('')

  const tree = new MerkleTree(
    inputTransactions.map(t => SHA256(Hex.parse(padTx(t))))
  )
  const root = tree.getRoot().toString('hex')

  return prefixWith0x(split8(root))
}

// ---------------------------------------------------------------------

/****************************************************************
 *      MAIN SCRIPT                                             *
 ****************************************************************/

const argv = yargs(process.argv.slice(2))
  .usage('usage: $0 <options> input')
  .example('$0 -n 10 -m 10 -b 3 -w 10 -t balances txs.json',
    'Generate an input.json from txs.json with' +
    ' 10 blocks, 10 transactions in each block,' +
    ' 3 accounts in total, and a whitelist of' +
    ' 10 entries for balances audit')
  .command({
    command: 'balances <input>',
    describe: 'Generate input for the balances auditor',
    builder: {
      n: {
        describe: 'Number of blocks',
        demandOption: true,
        type: 'number'
      },
      m: {
        describe: 'Number of transactions per block',
        demandOption: true,
        type: 'number'
      },
      b: {
        describe: 'Number of accounts',
        demandOption: true,
        type: 'number'
      }
    },
    handler: argv => { argv.type = 'balances' }
  })
  .command({
    command: 'whitelist <input>',
    describe: 'Generate input for the whitelist auditor',
    builder: {
      n: {
        describe: 'Number of blocks',
        demandOption: true,
        type: 'number'
      },
      m: {
        describe: 'Number of transactions per block',
        demandOption: true,
        type: 'number'
      },
      w: {
        describe: 'Length of whitelist',
        demandOption: true,
        type: 'number'
      }
    },
    handler: argv => { argv.type = 'whitelist' }
  })
  .command({
    command: 'merkle <input>',
    describe: 'Generate input for the Merkle-tree auditor',
    builder: {
      m: {
        describe: 'Number of transactions per block',
        demandOption: true,
        type: 'number'
      },
      i: {
        describe: 'Index of block (from zero) which should be audited',
        demandOption: true,
        type: 'number'
      }
    },
    handler: argv => { argv.type = 'merkle' }
  })
  .help('h')
  .wrap(72)
  .version(false)
  .argv

/* Read input data from file or stdin */
const data = JSON.parse(
  (argv._.length < 1 || argv.input === '-')
    ? fs.readFileSync('/dev/stdin')
    : fs.readFileSync(argv.input, 'utf8')
)

const result = []
switch (argv.type) {
  case 'balances': {
    result.push(transformBalances(data.balances, argv.b))

    const { blocks, blockCount } =
      transformBlocks(data.blocks, argv.n, argv.m)
    result.push(blocks)
    result.push(blockCount)

    break
  }

  case 'whitelist': {
    const { blocks, blockCount } =
      transformBlocks(data.blocks, argv.n, argv.m)
    result.push(blocks)
    result.push(blockCount)

    const { whitelist, wlCount } =
      transformWhitelist(data.whitelist, argv.w)
    result.push(whitelist)
    result.push(wlCount)

    break
  }

  case 'merkle': {
    /* XXX All transactions are considered, even dummy ones */
    // eslint-disable-next-line no-unused-vars
    const { transactions, txCount: _ } =
        transformTransactions(data.blocks[argv.i], argv.m)
    result.push(transactions)

    result.push(calculateRoot(transactions))

    break
  }
}
console.log(JSON.stringify(result, null, 2))
