Ez Mode 
-------

Dummy simple demo for the [connect-sdk](https://github.com/wormhole-foundation/connect-sdk)

# Setup

```sh
git clone git@github.com:barnjamin/ezmode.git
cd ezmode
npm i
```

This installs `@wormhole-foundation/connect-sdk` and 2 platform packages:

- `@wormhole-foundation/connect-sdk-evm` 
- `@wormhole-foundation/connect-sdk-solana`

Add keys in a `.env` file like:

```
SOL_PRIVATE_KEY="BASE_58_PRIVATE_KEY"
ETH_PRIVATE_KEY="BASE_16_PRIVATE_KEY"
```

# Run it

The program provided executes a simple manual token transfer from Avalanche to Celo.

```sh
npm run doit
```


