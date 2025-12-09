# Security Policy

## Supported Versions

We currently support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please **DO NOT** open a public issue. Instead, please email us at security@yesnomarket.com with the following information:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue before making it public.

## Security Best Practices

When deploying YesNoMarket contracts:

1. **Always audit contracts** before deploying to mainnet
2. **Use multi-sig wallets** for contract ownership
3. **Test thoroughly** on testnets before mainnet deployment
4. **Keep private keys secure** - never commit them to version control
5. **Monitor contracts** after deployment for unusual activity
6. **Use timelocks** for critical parameter changes
7. **Limit admin powers** where possible

## Known Security Considerations

- Contracts use OpenZeppelin's battle-tested libraries
- ReentrancyGuard protection is implemented
- Access control via Ownable pattern
- SafeERC20 for token transfers

## Audit Status

This codebase has not yet undergone a formal security audit. Use at your own risk.

For production deployments, we strongly recommend:
- Professional security audit
- Bug bounty program
- Insurance coverage

