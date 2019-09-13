#! /usr/bin/env node
'use strict'

const fs = require('fs-extra')
const path = require('path')

const cwd = process.cwd()
const args = process.argv.slice(2)
const out = path.join(
  path.join(cwd, args[0]),
  'index.html'
)

fs.copy(
  path.resolve(__dirname, './index.html'),
  out,
  e => {
    if (e) {
      throw e
    }

    console.log(`picosite created in ${out}`)
  }
)
