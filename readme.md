# secret-channel
A protocol for creating confidential communication channels. Uses [ECDH](https://en.wikipedia.org/wiki/Elliptic_curve_Diffie%E2%80%93Hellman) to bootstrap [AES](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)-[GCM](https://en.wikipedia.org/wiki/Galois/Counter_Mode) for each channel. Designed to run over a primitive transport such as UDP. Authentication is intentionally not addressed: the confidentiality problem is less interesting to me than the authenticity problem but existing protocols usually try to address both simultaneously which makes it difficult to experiment with new techniques.

*WARNING*: this is a just a quick sketch, it might sort of work but don't use it for anything real.

## Prior art
I had this idea while reading about the [DTLS](https://tools.ietf.org/html/rfc6347) protocol.

## TODO
* Prevent return address spoofing (e.g. DTLS requires handshake verification)
* Replay protection (DTLS uses seqence numbers with a rolling window)
* Don't expose message types unnecessarily
* Don't send error messages to peers unnecessarily
* Should renegotiation be supported?
* How/when should connections expire?
* Ordered mode?
* MTU / message fragmentation?

## License
MIT
