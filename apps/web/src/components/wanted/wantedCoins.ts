// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 fengzie and the respective contributors.

import { getPaymentCoinDisplayLabel } from '@mobazha/core/data/tokens';

/**
 * Currencies a buy request may be quoted and settled in.
 *
 * A node settles more chains than a buyer would ever quote a price in, so this
 * list is deliberately narrow: the assets the public node actually moves
 * (BTC/BCH/LTC over address transfer, ETH/BNB/SOL over external wallets) plus
 * the stablecoins those wallets carry. Naming a chain such as Base or Arbitrum
 * as a budget currency would be meaningless — the value moving over it is ETH,
 * USDT or USDC, and the chains themselves stay selectable at checkout.
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
  'USDT',
  'USDC',
];

export const WANTED_COINS: WantedCoin[] = WANTED_COIN_IDS.map(id => ({
  id,
  label: getPaymentCoinDisplayLabel(id) || id,
}));

/** Stablecoins are what most offers actually settle in, so lead with one. */
export const DEFAULT_WANTED_COIN = 'USDT';
