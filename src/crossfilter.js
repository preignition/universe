'use strict'

var Promise = require('q');
var crossfilter = require('crossfilter2')

var _ = require('./lodash')

module.exports = function(service) {

  return {
    build: build,
    generateColumns: generateColumns,
    add: add,
    remove: remove,
  }

  function build(c) {
    if (_.isArray(c)) {
      // This allows support for crossfilter async
      return Promise.resolve(crossfilter(c))
    }
    if (!c || typeof(c.dimension) !== 'function') {
      return Promise.reject(new Error('No Crossfilter data or instance found!'))
    }
    return Promise.resolve(c)
  }

  function generateColumns(data){
    if(!service.options.generatedColumns){
      return data
    }
    return _.map(data, function(d, i){
      _.forEach(service.options.generatedColumns, function(val, key){
        d[key] = val(d)
      })
      return d
    })
  }

  function add(data) {
    data = generateColumns(data)
    return Promise.try(function() {
        return Promise.resolve(service.cf.add(data))
      })
      .then(function() {
        var ds = []
        _.forEach(service.columns, function(column) {
          _.forEach(column.addListeners, function(listener) {
            ds.push(listener())
          })
        })
        return Promise.all(ds)
      })
      .then(function() {
        return service
      })
  }

  function remove() {
    return Promise.try(function() {
        return Promise.resolve(service.cf.remove())
      })
      .then(function() {
        return service
      })
  }
}
