# Copyright 2023 Contributors the the zkp-audit-zokrates repository
#
# Licensed under the Apache License, Version 2.0 (the "License"); you
# may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
# implied.  See the License for the specific language governing
# permissions and limitations under the License.

import sys
import contextlib
import itertools
import typing

import pandas as pd
import plac


programs = ['balances', 'whitelist', 'merkle']
measurements = ['compilation', 'setup', 'witness', 'proof']


def smart_open(filename: str,
               mode: str = 'r') -> (typing.IO[str]
                                    | contextlib.nullcontext[typing.TextIO]):
    """
    Open file but simply return stdin or stdout if name is a hyphen

    :param filename: name of file to open
    :param mode: mode to open file in
    :returns: filehandle to file
    """
    return (open(filename, mode)
            if filename != '-'
            else contextlib.nullcontext(sys.stdout
                                        if mode == 'w'
                                        else sys.stdin))


@plac.opt('file', "Path to CSV input file", str)
def main(file: str = '-'):
    with smart_open(file) as f:
        original = pd.read_csv(f)

    df = pd.DataFrame(index=programs)
    for p, m in itertools.product(programs, measurements):
        sel = original[original['program'] == p][m]
        df.at[p, f'{m}_mean'] = sel.mean()
        df.at[p, f'{m}_stderr'] = sel.sem()

    df.reset_index(inplace=True, names='program')
    print(df.to_csv(index=False))


def entry_point():
    plac.call(main)


if __name__ == '__main__':
    entry_point()
