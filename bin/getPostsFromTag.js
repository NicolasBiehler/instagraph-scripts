#!/usr/bin/env node
'use strict'

/**
 * Retrieve a list of posts urls from a hashtag.
 * Optionally save them in a csv file.
 */

const bent = require('bent')
const url = require('url')
const yargs = require('yargs')
const _ = require('lodash/fp')

const { appendToFile } = require('../lib/fileUtils.js')

const getJSON = bent('json')

const { argv } = yargs
  .option('tag', {
    describe: 'An instagram tag',
    alias: 't',
    demand: true,
  })
  .option('limit', {
    describe: 'Minimal amount of posts to get',
    alias: 'n',
    default: 500,
  })
  .option('file', {
    describe: 'File to save the result in',
    alias: 'f',
  })
  .strict()

const encodedTag = decodeURIComponent(argv.tag)
  ? encodeURIComponent(argv.tag)
  : argv.tag

function getUrl(maxId = null) {
  const parsedUrl = url.parse(
    `https://www.instagram.com/explore/tags/${encodedTag}/`,
    {
      parseQueryString: true,
    }
  )

  Object.assign(parsedUrl.query, { __a: 1 })
  if (maxId) {
    Object.assign(parsedUrl.query, { max_id: maxId })
  }
  return parsedUrl.format()
}

function filterPosts(posts) {
  return _.map(p => ({
    uri: `https://www.instagram.com/p/${p.code}`,
    date: new Date(p.date * 1000).toISOString(),
  }))(posts)
}

async function getPosts(maxId = null, previousPosts = []) {
  await appendToFile(argv.file, previousPosts)

  const uri = getUrl(maxId)
  console.log({ uri }, 'the url being queried')

  const { nodes: posts, count: totalAmount, page_info: pageInfo } = _.get([
    'tag',
    'media',
  ])(await getJSON(uri))

  const filteredPosts = [...previousPosts, ...filterPosts(posts)]
  const totalReceived = filteredPosts.length
  console.log({ totalReceived, totalAmount }, 'one page retrieved')

  if (totalReceived < argv.limit && pageInfo.has_next_page) {
    return getPosts(pageInfo.end_cursor, filteredPosts)
  }

  return {
    posts: filteredPosts,
    totalAmount,
    totalReceived,
  }
}

async function main() {
  const { totalAmount, totalReceived } = await getPosts()
  console.log({ totalReceived, totalAmount }, 'Received results')
}

main()
