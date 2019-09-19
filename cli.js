#! /usr/bin/env node
'use strict'

const fs = require('fs-extra')
const path = require('path')
const pkg = require('./package.json')

const cwd = process.cwd()
const args = require('minimist')(process.argv.slice(2))

const outDir = path.resolve(cwd, args.o || args.out || cwd)

const config = {
  version: pkg.version,
  repo: args.r || args.repo || 'estrattonbailey/picosite',
  theme: args.t || args.theme || 'default',
}

const index = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8')
const outFile = path.join(outDir, 'index.html')

const query = Object.keys(config)
  .map(key => {
    return key + '=' + encodeURIComponent(config[key])
  })
  .join('&')

fs.outputFileSync(
  outFile,
  index
    .replace('VERSION', pkg.version)
    .replace('QUERY', query)
)

console.log(`picosite created in ./${path.basename(outDir)}`)
