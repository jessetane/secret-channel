var UDPTransport = require('./transport')
var SecretChannel = require('../../')

var channel = new SecretChannel(
  new UDPTransport({
    port: process.env.PORT || 4430
  })
)

channel.on('connect', () => {
  console.log('connected to server')
})

channel.on('message', msg => {
  console.log('got message: ', msg.toString('utf8'))
})

channel.connect()

process.stdin.on('data', msg => {
  msg = msg.slice(0, -1)
  channel.send(msg)
})
