#! /usr/bin/env node
'use strict'

const fs = require('fs-extra')
const path = require('path')
const pkg = require('./package.json')

const cwd = process.cwd()
const args = process.argv.slice(2)

const index = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8')
const out = path.join(
  path.join(cwd, args[0]),
  'index.html'
)

fs.outputFileSync(out, index.replace('VERSION', pkg.version))

console.log(`picosite created in ${out}`)
