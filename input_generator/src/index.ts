import { getAddresses } from './data'
import { AuditTypes, generate } from './generator'
import { parse, validate } from './input'
import {
  command,
  flag,
  number,
  oneOf,
  option,
  optional,
  positional,
  run,
  string
} from 'cmd-ts'

const stdin = 0

const app = command({
  name: 'input_generator',
  args: {
    inputFile: option({
      type: optional(string),
      long: 'input-file',
      short: 'i'
    }),
    addressesFile: option({
      type: optional(string),
      long: 'addresses-file',
      short: 'a',
      defaultValue: () => 'addresses.json'
    }),
    blocks: option({
      type: number,
      long: 'total-blocks',
      short: 'n',
      defaultValue: () => 10
    }),
    transactions: option({
      type: number,
      long: 'total-transactions-per-blok',
      short: 'm',
      defaultValue: () => 10
    }),
    accounts: option({
      type: number,
      long: 'total-accounts',
      short: 'b',
      defaultValue: () => 10
    }),
    whitelist: option({
      type: number,
      long: 'total-whitelist-length',
      short: 'w',
      defaultValue: () => 10
    }),
    index: option({
      type: number,
      long: 'merkle-block-index',
      short: 'j',
      defaultValue: () => -1
    }),
    validateOnly: flag({
      long: 'validate-only',
      short: 'W'
    }),
    type: positional({
      displayName: 'audit type',
      type: oneOf(AuditTypes)
    })
  },
  handler: ({
    inputFile,
    addressesFile,
    type,
    blocks,
    transactions,
    accounts,
    validateOnly,
    whitelist,
    index
  }) => {
    if (validateOnly) {
      const result: boolean = validate(inputFile ?? stdin, true)
      console.log(`\n[${result ? 'OK' : 'FAIL'}]`)
      process.exit(result ? 0 : 1)
    }

    if (type === 'merkle' && index === -1) {
      throw new Error(
        'The block index option (-j) must be specified when' +
        ' generating input for the Merkle audit type'
      )
    }

    if (addressesFile === undefined) {
      throw new Error('Addresses file path must be defined')
    }

    console.log(
      JSON.stringify(
        generate(
          type,
          parse(inputFile ?? stdin),
          getAddresses(addressesFile),
          {
            totalBlocks: blocks,
            totalTransactionsPerBlock: transactions,
            totalAccounts: accounts,
            totalWhitelistLength: whitelist,
            merkleBlockIndex: index
          }
        )
      )
    )
  }
})

run(app, process.argv.slice(2)).catch(err => console.log(err))
