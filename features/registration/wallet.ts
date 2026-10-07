export const googleWalletPath = (checkinToken: string) =>
  `/api/wallet/google?token=${encodeURIComponent(checkinToken)}`
