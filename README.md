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
import { makeInMemoryStore } from '@rodrigogs/baileys-store'

const store = makeInMemoryStore({})
// You can bind the store to your Baileys instance
store.bind(baileysSock)
```

## Cache Manager Auth State

```js
import { makeCacheManagerAuthState } from '@rodrigogs/baileys-store'
import { caching } from 'cache-manager'

// Create a store with cache-manager
const store = await caching('memory')
// or any other cache-manager storage
const authState = await makeCacheManagerAuthState(store, 'session-key')
// Use the auth state in your baileys connection
const sock = makeWASocket({ auth: authState })
```


# Disclaimer
This project is not affiliated, associated, authorized, endorsed by, or in any way officially connected with WhatsApp or any of its subsidiaries or its affiliates.
The official WhatsApp website can be found at whatsapp.com. "WhatsApp" as well as related names, marks, emblems and images are registered trademarks of their respective owners.

The maintainers of Baileys do not in any way condone the use of this application in practices that violate the Terms of Service of WhatsApp. The maintainers of this application call upon the personal responsibility of its users to use this application in a fair way, as it is intended to be used.
Use at your own discretion. Do not spam people with this. We discourage any stalkerware, bulk or automated messaging usage.