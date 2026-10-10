// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 fengzie and the respective contributors.

import { getChainById, getPaymentCoinDisplayLabel, getTokenById } from '@mobazha/core/data/tokens';

/**
 * Currencies a buy request may be quoted and settled in.
 *
 * Stablecoins appear once per chain on purpose: USDT on Ethereum and USDT on
 * Solana are two assets with two different receiving addresses, and a seller
 * told only "USDT" cannot know which chain the money lands on. Native coins
 * carry no suffix because there the chain *is* the asset.
 *
 * The ids are the token registry's, not free-form tickers, so whatever the
 * buyer picks for a budget is the same id the offer and the eventual listing
 * quote against.
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
  'ETHUSDT',
  'BSCUSDT',
  'SOLUSDT',
  'MATICUSDT',
  'BASEUSDT',
  'ARBUSDT',
  'ETHUSDC',
  'BSCUSDC',
  'SOLUSDC',
  'MATICUSDC',
  'BASEUSDC',
  'ARBUSDC',
];

/** Base and Arbitrum only exist as chains in the registry, so name them here. */
const CHAIN_ONLY_LABELS: Record<string, string> = {
  BASE: 'Base',
  ARB: 'Arbitrum',
};

export function wantedCoinLabel(id: string): string {
  const token = getTokenById(id);
  if (token && !token.isNative) {
    const chainName = getChainById(token.chain)?.name ?? token.chain;
    return `${getPaymentCoinDisplayLabel(id) || id} · ${chainName}`;
  }
  return CHAIN_ONLY_LABELS[id] ?? (getPaymentCoinDisplayLabel(id) || id);
}

export const WANTED_COINS: WantedCoin[] = WANTED_COIN_IDS.map(id => ({
  id,
  label: wantedCoinLabel(id),
}));

/** USDT on Ethereum is what most offers actually settle in. */
export const DEFAULT_WANTED_COIN = 'ETHUSDT';
