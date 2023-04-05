import fs from 'fs'
import { Input } from './schema-in'

export function parse (inputFile: string | number): Input {
  return JSON.parse(fs.readFileSync(inputFile, 'utf8')) as Input
}
