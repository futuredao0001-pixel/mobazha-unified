// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 fengzie and the respective contributors.

/**
 * Buy request (wanted board) API service.
 *
 * Two endpoint families:
 *   - Public: browse open requests and read a request with its offers
 *   - Authenticated: publish a request, submit an offer, accept an offer
 *
 * Accepting an offer returns an order draft that the existing checkout flow
 * turns into an escrow-backed order, so no payment path is duplicated here.
 *
 * The board lives on the local node, so the authenticated calls use the
 * `nodeAuth*` helpers rather than `auth*`: the latter route a standalone buyer
 * to the SaaS gateway, which does not serve this node-local endpoint.
 */

import { NODE_API } from '../../config/apiPaths';
import { nodeAuthDel, nodeAuthGet, nodeAuthPost, publicGet } from './helpers';
import type {
  AcceptBuyRequestOfferResponse,
  BuyRequest,
  BuyRequestComment,
  BuyRequestCommentThread,
  BuyRequestDetailResponse,
  BuyRequestListFilter,
  BuyRequestListResponse,
  BuyRequestOffer,
  CreateBuyRequestCommentRequest,
  CreateBuyRequestOfferRequest,
  CreateBuyRequestRequest,
} from '../../types/buyRequest';

export type {
  AcceptBuyRequestOfferResponse,
  BuyRequest,
  BuyRequestComment,
  BuyRequestCommentThread,
  BuyRequestDetailResponse,
  BuyRequestListFilter,
  BuyRequestListResponse,
  BuyRequestOffer,
  CreateBuyRequestCommentRequest,
  CreateBuyRequestOfferRequest,
  CreateBuyRequestRequest,
} from '../../types/buyRequest';

function buildListQuery(filter?: BuyRequestListFilter): string {
  if (!filter) return '';
  const params = new URLSearchParams();
  if (filter.categorySlug) params.set('categorySlug', filter.categorySlug);
  if (filter.currency) params.set('currency', filter.currency);
  if (filter.deliverTo) params.set('deliverTo', filter.deliverTo);
  if (filter.status) params.set('status', filter.status);
  if (filter.page) params.set('page', String(filter.page));
  if (filter.pageSize) params.set('pageSize', String(filter.pageSize));
  const query = params.toString();
  return query ? `?${query}` : '';
}

// ========== Public ==========

export async function listBuyRequests(
  filter?: BuyRequestListFilter
): Promise<BuyRequestListResponse> {
  return publicGet<BuyRequestListResponse>(`${NODE_API.BUY_REQUESTS}${buildListQuery(filter)}`);
}

export async function getBuyRequest(slug: string): Promise<BuyRequestDetailResponse> {
  return publicGet<BuyRequestDetailResponse>(NODE_API.BUY_REQUEST(slug));
}

// ========== Authenticated ==========

export async function listMyBuyRequests(): Promise<BuyRequestListResponse> {
  return nodeAuthGet<BuyRequestListResponse>(NODE_API.BUY_REQUESTS_MINE);
}

export async function createBuyRequest(data: CreateBuyRequestRequest): Promise<BuyRequest> {
  return nodeAuthPost<BuyRequest>(NODE_API.BUY_REQUESTS, data);
}

export async function cancelBuyRequest(slug: string): Promise<BuyRequest> {
  return nodeAuthDel<BuyRequest>(NODE_API.BUY_REQUEST(slug));
}

export async function createBuyRequestOffer(
  slug: string,
  data: CreateBuyRequestOfferRequest
): Promise<BuyRequestOffer> {
  return nodeAuthPost<BuyRequestOffer>(NODE_API.BUY_REQUEST_OFFERS(slug), data);
}

export async function acceptBuyRequestOffer(
  slug: string,
  offerID: string
): Promise<AcceptBuyRequestOfferResponse> {
  return nodeAuthPost<AcceptBuyRequestOfferResponse>(NODE_API.BUY_REQUEST_ACCEPT(slug), {
    offerID,
  });
}

// ========== Comments ==========

export async function listBuyRequestComments(slug: string): Promise<BuyRequestCommentThread> {
  return publicGet<BuyRequestCommentThread>(NODE_API.BUY_REQUEST_COMMENTS(slug));
}

export async function createBuyRequestComment(
  slug: string,
  data: CreateBuyRequestCommentRequest
): Promise<BuyRequestComment> {
  return nodeAuthPost<BuyRequestComment>(NODE_API.BUY_REQUEST_COMMENTS(slug), data);
}
