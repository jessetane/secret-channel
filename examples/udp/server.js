var dgram = require('dgram')
var UDPTransport = require('./transport')
var SecretChannel = require('../../')

var channels = {}
var server = dgram.createSocket('udp4')

server.on('message', (msg, rinfo) => {
  var id = `${rinfo.address}:${rinfo.port}`
  var channel = channels[id]
  if (!channel) {
    channel = new SecretChannel(
      new UDPTransport({
        port: rinfo.port,
        host: rinfo.address,
        socket: server
      })
    )
    channels[id] = channel
    channel.on('connect', msg => {
      console.log(`connected to client: ${id}`)
    })
    channel.on('message', msg => {
      console.log(`got message from ${id}:`, msg.toString())
    })
    channel.on('close', () => {
      delete channels[id]
      console.log(`disconnected from client: ${id}`)
    })
    channel.connect()
  }
  channel.transport.emit('message', msg)
})

server.bind(process.env.PORT || 4430, err => {
  if (err) throw err
  var address = server.address()
  console.log(`udp server listening on ${address.address}:${address.port}`)
})

process.stdin.on('data', msg => {
  msg = msg.slice(0, -1)
  for (var id in channels) {
    channels[id].send(msg)
  }
})
