'use strict';


/****************************************************************
 *      HELPERS                                                 *
 ****************************************************************/

/* A string representing zero. */
const ZEROSTR = '0';

/*
 * Split a string every 8 characters.
 */
function split8(string) {
	return string.match(/.{1,8}/g);
}

/*
 * Prefix all elements of a string array with '0x'.
 */
function map_0xprefix(arr) {
	return arr.map(s => '0x' + s);
}


/*
 * Expand a simple number into a stringified u32[8] array for ZoKrates.
 */
function expand_number(number) {
	const revstr = s => Array.from(s).reverse().join('');
	const parts = split8(revstr(number.toString(16)))
		      .map(p => '0x' + revstr(p))
		      .map(p => parseInt(p, 16).toString())
		      .reverse();

	return [...Array(8 - parts.length).fill(ZEROSTR), ...parts];
}


/****************************************************************
 *      CONSTANTS                                               *
 ****************************************************************/

const orig_dummy_address = '0000000000000000000000000000000000000000';
const orig_addresses = [
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
	'ffd00efdb947a4c93d5ca4f2d5c916565a0baace',
];

const split_address = a => map_0xprefix(split8(a));

const dummy_address = split_address(orig_dummy_address);
const addresses = orig_addresses.map(a => split_address(a));


/****************************************************************
 *      MAIN FUNCTIONS                                          *
 ****************************************************************/

/*
 * Transform simple balances input `input_bals' to conform with the
 * balances audit program.
 */
function transform_balances(input_bals, total_accs) {
	let bals = Object.entries(input_bals).map(([acc, bal]) => [
		addresses[acc], expand_number(bal),
	]);
	bals.push(...Array(total_accs - balances.length).fill([
		dummy_address, expand_number(ZEROSTR),
	]));

	return bals;
}

/*
 * Transform simple transactions input `input_txs' to conform with the
 * audit programs.
 */
function transform_transactions(input_txs, total_txs) {
	let txs = input_txs.map(t => ({
		source:         addresses[t.source],
		destination:    addresses[t.destination],
		amount:         expand_number(t.amount),
	}));
	const n_txs = txs.length;
	txs.push(...Array(total_txs - n_txs).fill({
		source:         dummy_address,
		destination:    dummy_address,
		amount:         expand_number(ZEROSTR),
	}));

	return { transactions: txs, n_transactions: n_txs };
}

/*
 * Transform simple blocks input `input_blks' to conform with the
 * balances and whitelist audit programs.
 */
function transform_blocks(input_blks, total_blks, total_txs) {
	let blks = input_blks.map(
	    b => transform_transactions(b, total_txs)
	);
	const n_blks = blks.length;
	blks.push(...Array(total_blks - n_blocks).fill({
		transactions: Array(argv.m).fill({
			source:         dummy_address,
			destination:    dummy_address,
			amount:         expand_number(ZEROSTR),
		}),
		n_transactions: ZEROSTR,
	}));

	return { blocks: blks, n_blocks: n_blks.toString() };
}

/*
 * Transform simple whitelist input `input_wl' to conform with the
 * whitelist audit program.
 */
function transform_whitelist(input_wl, total_entries) {
	let wl = input_wl.map(a => addresses[a]);
	const n_wl = wl.length;
	wl.push(...Array(total_entries - n_wl).fill(dummy_address));

	return { whitelist: wl, n_whitelist: n_wl.toString() };
}

/*
 * Calculate the Merkle-tree root for simple array of
 * transactions `input_txs'.
 */
function calc_root(input_txs) {
	const { MerkleTree } = require('merkletreejs');
	const SHA256 = require('crypto-js/sha256');
	const Hex = require('crypto-js/enc-hex');

	const int2hex = x => {
		const buf = Buffer.alloc(4);
		buf.writeInt32BE(x);
		return buf.toString('hex');
	}
	const remove0x = x => x.slice(2);

	const padTx = t => [
		...Array(8 + 6).fill('00000000'),
		...t.source.map(p => remove0x(p)),
		...t.destination.map(p => remove0x(p)),
		...t.amount.map(p => int2hex(p)),
	].join('');

	const tree = new MerkleTree(
	    input_txs.map(t => SHA256(Hex.parse(padTx(t))))
	);
	const root = tree.getRoot().toString('hex');

	return map_0xprefix(split8(root));
}

// ---------------------------------------------------------------------


/****************************************************************
 *      MAIN SCRIPT                                             *
 ****************************************************************/

const argv = require('yargs/yargs')(process.argv.slice(2))
	     .usage("usage: $0 <options> input")
	     .example("$0 -n 10 -m 10 -b 3 -w 10 -t balances txs.json",
		      "Generate an input.json from txs.json with"
		      + " 10 blocks, 10 transactions in each block,"
		      + " 3 accounts in total, and a whitelist of"
		      + " 10 entries for balances audit")
	     .command({
		command: "balances <input>",
		describe: "Generate input for the balances auditor",
		builder: {
			n: {
				describe: "Number of blocks",
				demandOption: true,
				type: 'number',
			},
			m: {
				describe: "Number of transactions"
					+ " per block",
				demandOption: true,
				type: 'number',
			},
			b: {
				describe: "Number of accounts",
				demandOption: true,
				type: 'number',
			},
		},
		handler: argv => argv.type = 'balances',
	     })
	     .command({
		command: "whitelist <input>",
		describe: "Generate input for the whitelist auditor",
		builder: {
			n: {
				describe: "Number of blocks",
				demandOption: true,
				type: 'number',
			},
			m: {
				describe: "Number of transactions"
					+ " per block",
				demandOption: true,
				type: 'number',
			},
			w: {
				describe: "Length of whitelist",
				demandOption: true,
				type: 'number',
			},
		handler: argv => argv.type = 'whitelist',
		},
	     })
	     .command({
		command: "merkle <input>",
		describe: "Generate input for the Merkle-tree auditor",
		builder: {
			m: {
				describe: "Number of transactions"
					+ " per block",
				demandOption: true,
				type: 'number',
			},
			i: {
				describe: "Index of block (from zero)"
					+ " which should be audited",
				demandOption: true,
				type: 'number',
			},
		},
		handler: argv => argv.type = 'merkle',
	     })
	     .help('h')
	     .wrap(80)
	     .version(false)
	     .argv

/* Read input data from file or stdin */
const fs = require('fs')
const data = JSON.parse(
    (argv._.length < 1 || argv.input === '-')
    ? fs.readFileSync('/dev/stdin')
    : fs.readFileSync(argv.input, 'utf8')
);


let result = [];
switch (argv.type) {
case 'balances':
	result.push(transform_balances(data.balances, argv.b));

	const { b_blocks, b_n_blocks }
	    = transform_blocks(data.blocks, argv.n, argv.m);
	result.push(b_blocks);
	result.push(b_n_blocks);

	break;

case 'whitelist':
	const { w_blocks, w_n_blocks }
	    = transform_blocks(data.blocks, argv.n, argv.m);
	result.push(w_blocks);
	result.push(w_n_blocks);

	const { whitelist, n_whitelist }
	    = transform_whitelist(data.whitelist, argv.w);
	result.push(whitelist);
	result.push(n_whitelist);

	break;

case 'merkle':
	/* XXX All transactions are considered, even dummy ones */
	const { transactions, _ }
	    = transform_transactions(data.blocks[argv.i], argv.m);
	result.push(transactions);

	result.push(calc_root(transactions));

	break;
}
console.log(JSON.stringify(result, null, 2));
