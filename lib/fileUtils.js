'use strict'

const csv2 = require('csv2')
const json2csv = require('json2csv')
const fs = require('fs-extra')

async function appendToFile(
  file = null,
  posts = [],
  hasCSVColumnTitle = false
) {
  if (!file) {
    console.warn("No filename given, posts won't be saved")
    return
  }

  const csv = json2csv({
    data: posts,
    fields: ['uri', 'date', 'locationId', 'locationName', 'locationSlug'],
    hasCSVColumnTitle,
  })
  return fs.appendFile(file, csv + '\n', 'utf8')
}

async function readFileByLine(file = null, onData = () => {}) {
  if (!file) {
    console.warn('No file to read from')
  }

  return new Promise(resolve =>
    fs
      .createReadStream(file)
      .pipe(csv2())
      .on('data', onData)
      .on('end', () => resolve())
  )
}

module.exports = {
  appendToFile,
  readFileByLine,
}
