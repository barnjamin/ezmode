Ez Mode 
-------

Dummy simple demo for the [connect-sdk](https://github.com/wormhole-foundation/connect-sdk)

# Setup

```sh
git clone git@github.com:barnjamin/ezmode.git
cd ezmode
yarn
```

This installs `@wormhole-foundation/connect-sdk` and several platform packages.

# Signing Transactions

Add keys in a `.env` file like:

```
SOL_PRIVATE_KEY="BASE_58_PRIVATE_KEY"
ETH_PRIVATE_KEY="BASE_16_PRIVATE_KEY"
```

# Run it

Token Transfer

```sh
yarn transfer
```

Native USDC Transfer via CCTP

```sh
yarn cctp
```

Core messaging example

```sh
yarn msg
```

Create a wrapped token

```sh
yarn create
```


Get a VAA and parse it
```sh
yarn vaa
```
