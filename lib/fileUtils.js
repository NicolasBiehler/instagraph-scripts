'use strict'

const json2csv = require('json2csv')
const fs = require('fs-extra')

async function appendToFile(file = null, posts = []) {
  if (!file) {
    console.warn("No filename given, posts won't be saved")
    return
  }

  const csv = json2csv({
    data: posts,
    fields: ['uri', 'date'],
  })
  return fs.appendFile(file, csv + '\n', 'utf8')
}

async function readFileByLine(file = null) {
  if (!file) {
    console.warn('No file to read from')
  }
}

module.exports = {
  appendToFile,
  readFileByLine,
}
