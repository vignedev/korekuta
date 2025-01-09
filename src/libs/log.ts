import colors, { StyleFunction } from 'ansi-colors'
import cluster from 'node:cluster'
import { format } from 'node:util'

const expectedHeaderSize: number = 5
const { gray, red, cyan, green, yellow } = colors

function log(header: string, retcarriage: boolean, color: StyleFunction, args: any[]) {
  const clusterId = cluster.worker ? green(`[${cluster.worker.id.toString().padStart(3, ' ')}]`) : ''
  const fmt = format(gray(`[${new Date().toISOString()}]`), clusterId, color(`${header.padStart(expectedHeaderSize, ' ')}`), gray('|'), ...args)
  process.stdout.write(fmt + (retcarriage ? '\r' : '\n'))
}

export const      info = (...args: any[]) => log( 'INFO', false,   cyan, args)
export const    r_info = (...args: any[]) => log( 'INFO',  true,   cyan, args)
export const     error = (...args: any[]) => log('ERROR', false,    red, args)
export const   r_error = (...args: any[]) => log('ERROR',  true,    red, args)
export const   warning = (...args: any[]) => log( 'WARN', false, yellow, args)
export const r_warning = (...args: any[]) => log( 'WARN',  true, yellow, args)