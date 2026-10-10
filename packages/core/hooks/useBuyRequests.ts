// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 fengzie and the respective contributors.

/**
 * Buy request (wanted board) hooks — React Query.
 *
 * Same conventions as `useProducts`: shared cache, stale-while-revalidate and
 * automatic retry, so list/detail/offer views do not refetch independently.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buyRequestApi } from '../services/api';
import type {
  CreateBuyRequestCommentRequest,
  BuyRequestListFilter,
  CreateBuyRequestOfferRequest,
  CreateBuyRequestRequest,
} from '../types/buyRequest';
import { queryKeys } from './queryKeys';
import { formatQueryError } from './queryUtils';

function filterKey(filter?: BuyRequestListFilter): string {
  if (!filter) return 'all';
  return [
    filter.categorySlug ?? '',
    filter.currency ?? '',
    filter.deliverTo ?? '',
    filter.status ?? '',
    filter.page ?? 1,
    filter.pageSize ?? 20,
  ].join('|');
}

export function useBuyRequests(filter?: BuyRequestListFilter) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.buyRequests.list(filterKey(filter)),
    queryFn: () => buyRequestApi.listBuyRequests(filter),
    staleTime: 60_000,
  });

  return {
    requests: data?.requests ?? [],
    total: data?.total ?? 0,
    isLoading,
    error: formatQueryError(error),
    refetch,
  };
}

export function useBuyRequestDetail(slug: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.buyRequests.detail(slug ?? ''),
    queryFn: () => buyRequestApi.getBuyRequest(slug as string),
    enabled: !!slug,
    staleTime: 30_000,
  });

  return {
    request: data?.request ?? null,
    offers: data?.offers ?? [],
    isLoading,
    error: formatQueryError(error),
    refetch,
  };
}

export function useMyBuyRequests(enabled = true) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.buyRequests.mine(),
    queryFn: () => buyRequestApi.listMyBuyRequests(),
    enabled,
    staleTime: 30_000,
  });

  return {
    requests: data?.requests ?? [],
    isLoading,
    error: formatQueryError(error),
    refetch,
  };
}

export function useCreateBuyRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBuyRequestRequest) => buyRequestApi.createBuyRequest(data),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.buyRequests.all });
    },
  });
}

export function useCreateBuyRequestOffer(slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBuyRequestOfferRequest) =>
      buyRequestApi.createBuyRequestOffer(slug, data),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.buyRequests.detail(slug) });
    },
  });
}

/**
 * Accepting an offer locks the request and returns an order draft that the
 * caller hands to checkout. The list cache is invalidated because the request
 * leaves the open pool.
 */
export function useAcceptBuyRequestOffer(slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (offerID: string) => buyRequestApi.acceptBuyRequestOffer(slug, offerID),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.buyRequests.all });
      void client.invalidateQueries({ queryKey: queryKeys.buyRequests.detail(slug) });
    },
  });
}

/** Closing a request removes it from the open board, so both caches refresh. */
export function useCancelBuyRequest(slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => buyRequestApi.cancelBuyRequest(slug),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.buyRequests.all });
      void client.invalidateQueries({ queryKey: queryKeys.buyRequests.detail(slug) });
    },
  });
}

export function useBuyRequestComments(slug: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.buyRequests.comments(slug),
    queryFn: () => buyRequestApi.listBuyRequestComments(slug),
    enabled: !!slug,
    staleTime: 15_000,
  });

  return {
    comments: data?.comments ?? [],
    total: data?.total ?? 0,
    isLoading,
    error: formatQueryError(error),
    refetch,
  };
}

export function useCreateBuyRequestComment(slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBuyRequestCommentRequest) =>
      buyRequestApi.createBuyRequestComment(slug, data),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.buyRequests.comments(slug) });
    },
  });
}
