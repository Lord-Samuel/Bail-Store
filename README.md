# Baileys Store

A storage implementation for [Baileys](https://github.com/Lord-Samuel/Bail-lite) - the WebSocket-based WhatsApp Web API library.

![npm](https://img.shields.io/npm/v/baileys-store)
![GitHub issues](https://img.shields.io/github/issues/Lord-Samuel/Bail-Store)

# Installation

```bash
npm install bail-store
```

Note: This package requires `baileys` as a peer dependency. Make sure to install it alongside this package.

# Usage

This package provides different storage implementations for Baileys:

1. In-Memory Store
2. Cache Manager Auth State

## In-Memory Store

```js
import { makeInMemoryStore } from 'bail-store'

const store = makeInMemoryStore({})
// You can bind the store to your Baileys instance
store.bind(baileysSock)
```


# Disclaimer
This project is not affiliated, associated, authorized, endorsed by, or in any way officially connected with WhatsApp or any of its subsidiaries or its affiliates.

Use at your own discretion. Do not spam people with this. We discourage any stalkerware, bulk or automated messaging usage.
