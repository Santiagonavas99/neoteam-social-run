// iPadOS in desktop mode reports itself as a Mac, so it still gets the link; Google's page explains it.
export const isAppleMobile = (userAgent: string) => /iPhone|iPad|iPod/i.test(userAgent)

export const googleWalletPath = (checkinToken: string) =>
  `/api/wallet/google?token=${encodeURIComponent(checkinToken)}`
