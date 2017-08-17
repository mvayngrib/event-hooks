const once = require('once')
const Promise = require('any-promise')
const co = require('co').wrap
const isPromise = obj => obj && typeof obj.then === 'function'

const series = co(function* (fns, ...args) {
  for (let i = 0; i < fns.length; i++) {
    let fn = fns[i]
    let maybePromise = fn(...args)
    if (isPromise(maybePromise)) {
      yield maybePromise
    }
  }
})

const waterfall = co(function* (fns, ...args) {
  let result
  for (let fn of fns) {
    result = fn.apply(this, args)
    if (isPromise(result)) {
      result = yield result
    }

    args = [result]
  }

  return result
})

const bubble = co(function* (fns, ...args) {
  for (let i = 0; i < fns.length; i++) {
    let fn = fns[i]
    let ret = fn(...args)
    if (isPromise(ret)) {
      ret = yield ret
    }

    if (ret === false) return false
  }
})

module.exports = {
  Promise,
  co,
  series,
  bubble,
  waterfall,
  isPromise,
  once
}
