// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 fengzie and the respective contributors.

import { getPaymentCoinDisplayLabel } from '@mobazha/core/data/tokens';

/**
 * Currencies a buy request may be quoted and settled in.
 *
 * This mirrors what a public node actually settles, named the way the platform
 * names it: the assets moved over address transfer (BTC/BCH/LTC), the chains a
 * buyer brings an external wallet to (ETH, BNB, SOL, Polygon, Base, Arbitrum),
 * and the stablecoins those wallets carry. It is deliberately narrower than the
 * token registry, which also lists every chain-suffixed variant of a stablecoin
 * (BASEUSDT, ARBUSDC, …) that nobody quotes a budget in.
 */
export interface WantedCoin {
  id: string;
  label: string;
}

export const WANTED_COIN_IDS: readonly string[] = [
  'BTC',
  'BCH',
  'LTC',
  'ETH',
  'BNB',
  'SOL',
  'MATIC',
  'BASE',
  'ARB',
  'USDT',
  'USDC',
];

/**
 * Polygon is also a token id, so the registry already labels it. Base and
 * Arbitrum only exist as chains there, and a chain id is not a display name.
 */
const CHAIN_LABELS: Record<string, string> = {
  BASE: 'Base',
  ARB: 'Arbitrum',
};

export const WANTED_COINS: WantedCoin[] = WANTED_COIN_IDS.map(id => ({
  id,
  label: CHAIN_LABELS[id] ?? (getPaymentCoinDisplayLabel(id) || id),
}));

/** Stablecoins are what most offers actually settle in, so lead with one. */
export const DEFAULT_WANTED_COIN = 'USDT';
