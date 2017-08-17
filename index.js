const { EventEmitter } = require('events')
const {
  co,
  isPromise,
  series,
  waterfall,
  bubble,
  once
} = require('./utils')

module.exports = function createHookedEmitter (obj) {
  const hooks = new EventEmitter()
  const handlers = {}
  const defaults = {}

  hooks.has = event => {
    const fns = getHandlers(event)
    return fns && fns.length
  }

  hooks.fire = co(function* (event, ...args) {
    const fns = getHandlers(event)
    if (fns && fns.length) {
      yield series(fns, ...args)
    }

    hooks.emit(event, ...args)
  })

  hooks.waterfall = co(function* (event, ...args) {
    const fns = getHandlers(event)
    let ret
    if (fns && fns.length) {
      ret = yield waterfall(fns, ...args)
    }

    hooks.emit(event, ret)
    return ret
  })

  hooks.bubble = co(function* (event, ...args) {
    const fns = getHandlers(event)
    if (fns && fns.length) {
      const keepGoing = yield bubble(fns, ...args)
      if (keepGoing === false) return false
    }

    hooks.emit(event, ...args)
  })

  hooks.hook = function (event, handler, unshift) {
    if (!(event in handlers)) {
      handlers[event] = []
    }

    if (unshift) {
      handlers[event].unshift(handler)
    } else {
      handlers[event].push(handler)
    }

    return once(function unhook () {
      handlers[event] = handlers[event].filter(fn => fn !== handler)
    })
  }

  hooks.prependHook = function (event, handler) {
    return hooks.hook(event, handler, true)
  }

  hooks.default = function (event, handler) {
    // wrap in array for processing convenience later
    defaults[event] = [handler]
  }

  function getHandlers (event) {
    const forEvent = handlers[event]
    if (forEvent && forEvent.length) return forEvent

    return defaults[event]
  }

  return hooks
}
