var tape = require('tape')
var Emitter = require('events')
var SecretChannel = require('../')

class DummyTransport extends Emitter {
  send (msg, cb) {
    setTimeout(() => {
      this.socket.emit('message', msg)
      cb()
    })
  }

  close () {
    this.emit('close')
  }
}

tape('work', t => {
  t.plan(6)

  var alice = new SecretChannel(
    new DummyTransport()
  )

  var bob = new SecretChannel(
    new DummyTransport()
  )

  alice.id = 'alice'
  bob.id = 'bob'

  // MITM from alice to bob
  var toEveFromAlice = new Emitter()
  toEveFromAlice.on('message', msg => {
    if (msg[0] === 0x2) {
      var str = msg.toString()
      t.notEqual(str, 'hello')
    }
    bob.transport.emit('message', msg)
  })
  alice.transport.socket = toEveFromAlice

  // MITM from bob to alice
  var toEveFromBob = new Emitter()
  toEveFromBob.on('message', msg => {
    if (msg[0] === 0x2) {
      var str = msg.toString()
      t.notEqual(str, 'world')
    }
    alice.transport.emit('message', msg)
  })
  bob.transport.socket = toEveFromBob

  alice.on('connect', () => {
    t.pass('alice connected')
    alice.send('hello')
  })

  bob.on('connect', () => {
    t.pass('bob connected')
  })

  bob.on('message', msg => {
    t.equal(msg.toString(), 'hello')
    bob.send('world')
  })

  alice.on('message', msg => {
    t.equal(msg.toString(), 'world')
  })

  alice.connect()
  bob.connect()
})
