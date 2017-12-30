#!/usr/bin/env node
'use strict'

/**
 * Find location metrics from a list of locations coming from a CSV file.
 */

const bent = require('bent')
const yargs = require('yargs')
const _ = require('lodash/fp')

const { readFileByLine, appendToLocationFile } = require('../lib/fileUtils.js')

const getJSON = bent('json')

const { argv } = yargs
  .option('input', {
    describe: 'Input file with a list of locations',
    alias: 'i',
    demand: true,
  })
  .option('output', {
    describe: 'File to save the result in',
    alias: 'o',
  })
  .strict()

async function getLocationMetrics({ locationId, locationSlug }) {
  const uri = `https://www.instagram.com/explore/locations/${locationId}/${locationSlug}/?__a=1`

  return filterLocationMetrics(await getJSON(uri))
}

function filterLocationMetrics({ location: { media: { count, nodes } } }) {
  const latestDates = _.map(p =>
    new Date(_.get('date', p) * 1000).toISOString()
  )(nodes)

  return {
    amountOfPosts: count,
    latestDates: _.uniq(latestDates),
  }
}

async function main() {
  const onData = async function(data) {
    const location = {
      locationId: data[2],
      locationName: data[3],
      locationSlug: data[4],
    }
    const metrics = await getLocationMetrics(location)
    console.log({ ...location, ...metrics }, 'Found metrics')
    if (argv.output) {
      return appendToLocationFile(argv.output, [
        {
          ...location,
          ...metrics,
          date: data[1],
        },
      ])
    }
  }

  await readFileByLine(argv.input, onData)
}

main()
