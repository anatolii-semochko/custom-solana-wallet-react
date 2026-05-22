# Changelog

## [1.1.0] - Configuration System

### Added
- **External Configuration Support**: New `SevensWalletConfigurableProvider` for runtime configuration
- **Configuration Context**: React Context-based configuration management with `useWalletConfig` hook
- **Utility Functions**: Non-React configuration access via `getConfig`, `getConfigValue`, and `safeGetConfig`
- **Custom RPC Endpoints**: Ability to override default Solana RPC connections
- **Configurable Security**: Customizable password policies and security settings
- **Language Extensions**: Support for adding custom languages beyond the default 4

### Changed
- **Version**: Bumped to 1.1.0 with new configuration capabilities
- **Package Description**: Updated to reflect configuration support
- **Documentation**: Comprehensive configuration examples in README

### Technical Details
- Maintains full backward compatibility with default configuration
- Solves npm package limitation where internal config.json is read-only
- Supports both React Context and global configuration patterns
- Deep merges custom configuration with defaults

## [1.0.0] - Initial Release

### Added
- Custom Solana wallet adapter implementation
- Complete UI component library for wallet management
- Multi-language support (English, Ukrainian, Spanish, German)
- Transaction signing and message signing capabilities
- Token management with burn and transfer operations
- Real-time price updates via WebSocket connection
- Secure wallet operations with password protection
- Wallet creation, restoration, and management
- QR code support for address sharing
- Comprehensive error handling and validation

### Features
- **Wallet Adapter**: Built on top of @solana/wallet-adapter-base with full Phantom API compatibility
- **UI Components**: Ready-to-use React components for all wallet operations
- **Security**: Encrypted storage with password protection
- **Internationalization**: Built-in translation system
- **Token Support**: Custom token management for Solana-based tokens
- **Real-time Updates**: WebSocket integration for live price feeds