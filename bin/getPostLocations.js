#!/usr/bin/env node
'use strict'

/**
 * From a list of urls coming from a CSV file,
 * the script appends the location to the csv entry
 */

const bent = require('bent')
const execa = require('execa')
const { isURL } = require('validator')
const yargs = require('yargs')
const _ = require('lodash/fp')

const { readFileByLine, appendToFile } = require('../lib/fileUtils.js')

const getJSON = bent('json')

const { argv } = yargs
  .option('input', {
    describe: 'Input file with a list of urls',
    alias: 'i',
    demand: true,
  })
  .option('output', {
    describe: 'File to save the result in',
    alias: 'o',
    demand: true,
  })
  .option('sort', {
    describe: 'sort the result in the csv file',
    alias: 's',
    default: false,
  })
  .strict()

async function getLocation(postUrl) {
  const uri = `${postUrl}/?__a=1`

  return filterLocation(await getJSON(uri))
}

function filterLocation(post) {
  const defaults = { id: null, name: null, slug: null }
  let location = _.getOr(defaults, 'graphql.shortcode_media.location', post)

  // TODO: somehow lodash/fp getOr is buggy..
  if (!location) {
    location = defaults
  }
  return {
    locationId: location.id,
    locationName: location.name,
    locationSlug: location.slug,
  }
}

async function main() {
  const onData = async function(data) {
    const postUrl = data[0]
    if (isURL(postUrl)) {
      const location = await getLocation(postUrl)
      if (location.locationId) {
        console.log({ postUrl }, 'Saving post')
        return appendToFile(argv.output, [
          {
            ...location,
            uri: postUrl,
            date: data[1],
          },
        ])
      } else {
        console.log({ postUrl }, 'Skipping post without location')
      }
    }
  }

  await readFileByLine(argv.input, onData)
  if (argv.sort) {
    const sortCmd = `sort -u -t, -k3,3 ${argv.output} > ${
      argv.output
    }-filtered `
    await execa.shell(sortCmd)
  }
}

main()
