var Emitter = require('events')
var crypto = require('crypto')

var messageTypes = {
  HANDSHAKE: new Buffer([ 0x1 ]),
  MESSAGE: new Buffer([ 0x2 ]),
  CLOSE: new Buffer([ 0x3 ]),
  STATE_ERROR: new Buffer([ 0x4 ]),
  HANDSHAKE_ERROR: new Buffer([ 0x5 ]),
  ENCRYPTION_ERROR: new Buffer([ 0x6 ])
}

module.exports = class SecretChannel extends Emitter {
  constructor (transport) {
    super()
    // private
    this._onmessage = this._onmessage.bind(this)
    this._onclose = this._onclose.bind(this)
    this._dh = null
    this._key = null
    this._secret = null
    this._encipher = null
    this._decipher = null
    // public
    this.transport = transport
    this.transport.on('close', this._onclose)
    this.connected = false
    this.closing = false
  }

  connect () {
    if (this._dh) {
      this.emit('error', new Error('invalid state for connect'))
      return
    }
    this._dh = crypto.createECDH('prime256v1')
    this._key = this._dh.generateKeys()
    this.transport.on('message', this._onmessage)
    this.transport.send(Buffer.concat([ messageTypes.HANDSHAKE, this._key ]), err => {
      if (err) {
        this.emit('error', err)
        this._close()
      }
    })
  }

  send (msg, cb) {
    if (!this.connected || this.closing) {
      this.emit('error', new Error('invalid state for send'))
      return
    }
    msg = this._encipher.update(msg)
    this.transport.send(Buffer.concat([ messageTypes.MESSAGE, msg ]), err => {
      if (cb) {
        cb(err)
      } else if (err) {
        this.emit('error', err)
        this._close()
      }
    })
  }

  close () {
    this._beginClose()
    this.transport.send(messageTypes.CLOSE, () => {
      this._close()
    })
  }

  _beginClose () {
    this.transport.removeListener('message', this._onmessage)
    this.closing = true
    this.emit('closing')
  }

  _close () {
    this.closing = false
    this.connected = false
    this.transport.removeListener('close', this._onclose)
    this.transport.removeListener('message', this._onmessage)
    this.transport.close()
    this.emit('close')
  }

  _onclose () {
    this._close()
  }

  _onmessage (msg) {
    var messageType = msg[0]
    switch (messageType) {
      case 0x1: // handshake
        if (this._secret) {
          // invalid state
          this._beginClose()
          this.transport.send(messageTypes.STATE_ERROR, () => {
            this._close()
          })
        } else if (msg.length !== 66) {
          // handshake must be 66 bytes
          this._beginClose()
          this.transport.send(messageTypes.HANDSHAKE_ERROR, () => {
            this._close()
          })
        } else {
          this._secret = this._dh.computeSecret(msg.slice(1))
          this._encipher = crypto.createCipher('aes-128-gcm', this._secret)
          this._decipher = crypto.createDecipher('aes-128-gcm', this._secret)
          this.connected = true
          this.emit('connect')
        }
        break
      case 0x2: // normal message
        try {
          msg = this._decipher.update(msg.slice(1))
        } catch (err) {
          this._beginClose()
          this.transport.send(messageTypes.ENCRYPTION_ERROR, () => {
            this._close()
          })
          return
        }
        this.emit('message', msg)
        break
      case 0x3: // normal close
        this._close()
        break
      case 0x4:
        this.emit('error', new Error('invalid state'))
        this._close()
        break
      case 0x5:
        this.emit('error', new Error('invalid handshake'))
        this._close()
        break
      case 0x6:
        this.emit('error', new Error('encryption error'))
        this._close()
        break
      default:
        this.emit('error', new Error('unknown message type'))
        this._close()
    }
  }
}
