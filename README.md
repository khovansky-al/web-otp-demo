# Web OTP Demo

This is a 2FA OTP code generator written in JS.

It is a supplementary demo for
my article [Generating 2FA One-Time Passwords in JS Using Web Crypto API]()
<INSERT LINK>.

As you can see from the article's title it uses Web Crypto API.
It also uses [stream-display](https://github.com/khovansky-al/stream-display)
and [jsQR](https://github.com/cozmo/jsQR) libraries to recognize 2FA QR codes.

Live demo can be found [here](https://khovansky.me/demos/web-otp)

## Running locally

Just run your favourite http server against the `dist` directory. For example

```bash
npm i -g http-server
http-server dist
```

Additionally if you want to tinker with it -- you'll need to rebuild the sources
before running the server.

```bash
npm install
npm run build
```

