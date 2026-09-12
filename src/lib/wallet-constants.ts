// Split out from lib/wallet.ts because that file imports the Prisma client
// (server-only, pulls in the `pg` driver) — WithdrawBlock is a client
// component and just needs this one number, not the rest of that module.
export const WITHDRAWAL_MIN_BALANCE = 1000;
