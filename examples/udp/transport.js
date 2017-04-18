var dgram = require('dgram')
var Emitter = require('events')

module.exports = class UDPTransport extends Emitter {
  constructor (opts) {
    super()
    this.port = opts.port
    this.host = opts.host || 'localhost'
    this.isServer = !!opts.socket
    if (this.isServer) {
      this.socket = opts.socket
    } else {
      this.socket = dgram.createSocket('udp4')
      this.socket.on('message', msg => {
        this.emit('message', msg)
      })
    }
  }

  send (msg, cb) {
    this.socket.send(msg, this.port, this.host, cb)
  }

  close () {
    if (!this.isServer) {
      this.socket.close()
    }
  }
}
