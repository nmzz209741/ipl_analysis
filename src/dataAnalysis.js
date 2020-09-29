const data = require('../final.json')
const _ = require('lodash')
const allData = _.flatten(data)
const teamWise = _.groupBy(allData, data => data.title)

