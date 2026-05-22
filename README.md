# Sevens Wallet React

A comprehensive React library for building custom Solana wallet interfaces. Built on top of the Phantom Wallet Adapter interface with full compatibility and extended functionality.

## 🚀 Features

### Core Wallet Adapter
- **Full Phantom API Compatibility**: Drop-in replacement for Phantom wallet with identical interface
- **Solana Integration**: Built on @solana/wallet-adapter-base for seamless blockchain interaction
- **Custom Network Support**: Configurable endpoints for mainnet, devnet, testnet, and custom networks
- **Auto-connection**: Persistent wallet sessions with automatic reconnection

### Comprehensive UI Components
- **Complete Wallet Management**: Create, restore, import, and manage multiple wallets
- **Transaction Interface**: User-friendly transaction signing with detailed previews
- **Token Operations**: Full SPL token support with mint, transfer, and burn capabilities
- **Settings Panel**: Network switching, password management, and language preferences
- **Security Components**: Password-protected operations with encrypted storage

### Multi-language Support
- **4 Languages**: English, Ukrainian, Spanish, German
- **210+ UI Translations**: Complete interface localization
- **Dynamic Language Switching**: Real-time language changes
- **Cultural Formatting**: Localized number and currency formatting

### Advanced Security
- **Encrypted Storage**: CryptoJS-based encryption for sensitive data
- **Password Protection**: Secure access to all critical operations
- **Transaction Validation**: Pre-signing validation and simulation
- **Private Key Safety**: Secure handling and storage of cryptographic keys

### Developer Experience
- **TypeScript Support**: Full type definitions included
- **React 18 Compatible**: Built for modern React applications
- **Modular Architecture**: Import only the components you need
- **Comprehensive Documentation**: Detailed API reference and examples

## 📦 Installation

```bash
npm install sevens-wallet-react
```

## 🛠 Quick Start

### Basic Setup

```jsx
import React from 'react'
import {
  SevensWalletProvider,
  SevensWalletInitializer,
  WalletContent
} from 'sevens-wallet-react'

function App() {
  return (
    <SevensWalletProvider>
      <SevensWalletInitializer>
        <WalletContent />
      </SevensWalletInitializer>
    </SevensWalletProvider>
  )
}

export default App
```

### With Solana Wallet Adapter

```jsx
import { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { SevensWalletAdapter } from 'sevens-wallet-react'

function App() {
  const wallets = useMemo(() => [
    new SevensWalletAdapter(),
  ], [])

  return (
    <ConnectionProvider endpoint="https://api.mainnet-beta.solana.com">
      <WalletProvider wallets={wallets}>
        {/* Your app components */}
      </WalletProvider>
    </ConnectionProvider>
  )
}
```

## 🧩 Components

### Core Components

#### `SevensWalletProvider`
Main provider component that manages wallet state and context.

```jsx
import { SevensWalletProvider } from 'sevens-wallet-react'

<SevensWalletProvider>
  {/* Your wallet components */}
</SevensWalletProvider>
```

#### `SevensWalletInitializer`
Handles wallet initialization and authentication flow.

```jsx
import { SevensWalletInitializer } from 'sevens-wallet-react'

<SevensWalletInitializer>
  {/* Components that need wallet access */}
</SevensWalletInitializer>
```

#### `WalletContent`
Complete wallet interface with all functionality.

```jsx
import { WalletContent } from 'sevens-wallet-react'

<WalletContent />
```

### UI Components

#### `WalletBlock`
Main wallet display with balance and quick actions.

```jsx
import { WalletBlock } from 'sevens-wallet-react'

<WalletBlock />
```

#### `SendCoins`
Component for sending SOL to other addresses.

```jsx
import { SendCoins } from 'sevens-wallet-react'

<SendCoins />
```

#### `Settings`
Comprehensive settings panel for wallet configuration.

```jsx
import { Settings } from 'sevens-wallet-react'

<Settings />
```

#### `SignTransaction` / `SignMessage`
Components for transaction and message signing.

```jsx
import { SignTransaction, SignMessage } from 'sevens-wallet-react'

<SignTransaction transaction={transaction} />
<SignMessage message={message} />
```

### Form Elements

```jsx
import {
  Blocks,
  Inputs,
  Buttons,
  Messages
} from 'sevens-wallet-react'

// Styled form components matching wallet design
<Inputs.Password placeholder="Enter password" />
<Buttons.Primary onClick={handleSubmit}>Submit</Buttons.Primary>
<Messages.Error>Error message</Messages.Error>
```

## 🔧 API Reference

### Hooks

#### `useWalletContext`
Access wallet state and operations.

```jsx
import { useWalletContext } from 'sevens-wallet-react'

function MyComponent() {
  const {
    currentWallet,
    isLocked,
    unlockWallet,
    lockWallet,
    createWallet,
    // ... other wallet operations
  } = useWalletContext()

  return (
    <div>
      {currentWallet ? (
        <p>Wallet: {currentWallet.name}</p>
      ) : (
        <button onClick={createWallet}>Create Wallet</button>
      )}
    </div>
  )
}
```

### Adapter

#### `SevensWalletAdapter`
Solana wallet adapter implementation.

```jsx
import { SevensWalletAdapter } from 'sevens-wallet-react'

const adapter = new SevensWalletAdapter()

// Standard wallet adapter methods
await adapter.connect()
await adapter.disconnect()
const signature = await adapter.signTransaction(transaction)
const signature = await adapter.signMessage(message)
```

## ⚙️ Configuration

### Network Configuration

```javascript
// src/config.json
{
  "CONNECTION_ENDPOINTS": {
    "main": "https://api.mainnet-beta.solana.com",
    "dev": "https://api.devnet.solana.com",
    "local": "http://localhost:8899",
    "custom": ""
  }
}
```

### Language Configuration

```javascript
// Supported languages
{
  "LANGUAGES": {
    "en": "English",
    "uk": "Українська",
    "es": "Español",
    "de": "Deutsch"
  }
}
```

### Security Settings

```javascript
{
  "PASSWORD_MIN_LENGTH": 6,
  "PASSWORD_REPEAT_DELAY_SECONDS": 5,
  "RELOAD_AFTER_CHANGES_SECONDS": 3
}
```

## 🔐 Security Features

- **Encrypted Local Storage**: All sensitive data encrypted with AES
- **Password Protection**: Required for all critical operations
- **Session Management**: Automatic locking after inactivity
- **Transaction Validation**: Pre-signing simulation and validation
- **Error Handling**: Secure error messages without data leakage

## 🌐 Internationalization

The library includes complete translations for:

- **English (en)**: Default language
- **Ukrainian (uk)**: Full localization
- **Spanish (es)**: Complete translation
- **German (de)**: Full language support

All UI text, error messages, and help content are fully localized.

## 📱 Responsive Design

- Mobile-first responsive design
- Touch-friendly interface elements
- Adaptive layouts for all screen sizes
- Progressive enhancement for desktop features

## 🧪 Token Operations

### SPL Token Support
- Automatic token account creation
- Token transfers between addresses
- Token burning capabilities
- Balance checking and display
- Custom token metadata integration

### Advanced Features
- Transaction simulation before signing
- Gas fee estimation and display
- Batch transaction support
- Custom program interaction via Anchor

## 🔧 Development

### Prerequisites

- Node.js 16+
- React 18+
- @solana/web3.js
- @solana/wallet-adapter-base

### Peer Dependencies

```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0"
}
```

### TypeScript Support

The library includes comprehensive TypeScript definitions:

```typescript
import type {
  WalletContextType,
  WalletData,
  TransactionResult
} from 'sevens-wallet-react'
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For questions and support, please open an issue on the [GitHub repository](https://github.com/username/sevens-wallet-react/issues).

---

**Note**: This library is designed for educational and development purposes. Always follow security best practices when handling cryptocurrency wallets in production applications.