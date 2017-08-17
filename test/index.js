const test = require('tape')
const {
  Promise,
  co,
  series,
  bubble
} = require('../utils')

const createHookedEmitter = require('../')

test('hooks', loudCo(function* (t) {
  const hooks = createHookedEmitter()
  const fired = {}
  const aArgs = [1, 2]

  let defaultOn = true
  yield new Promise(resolve => {
    hooks.default('a', function () {
      t.equal(defaultOn, true)
      resolve()
    })

    hooks.fire('a', 1)
  })

  defaultOn = false
  hooks.hook('a', function (...args) {
    t.same(args, aArgs)
    fired['a'] = true
    // prevent subsequent handlers
    return false
  })

  const promiseA = new Promise(resolve => hooks.once('a', (...args) => resolve(args)))
  yield hooks.fire('a', ...aArgs)
  t.ok(fired['a'])
  t.same(yield promiseA, aArgs)

  // will not fire if bubble() is used because `false` is returned
  // in the previous handler
  hooks.hook('a', function (...args) {
    t.fail('should have been prevented')
  })

  hooks.on('a', t.fail)
  yield hooks.bubble('a', ...aArgs)

  t.end()
}))

function loudCo (gen) {
  return co(function* (...args) {
    try {
      yield co(gen)(...args)
    } catch (err) {
      console.error(err)
      throw err
    }
  })
}
