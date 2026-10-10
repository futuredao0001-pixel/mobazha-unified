// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 fengzie and the respective contributors.

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components';
import { Container, Grid } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorAlert } from '@/components/ui/error-alert';
import { ImageOff } from 'lucide-react';
import { TokenIcon } from '@/components/Payment/TokenIcon';
import { BuyRequestStatusBadge } from '@/components/wanted/BuyRequestStatusBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getImageUrl, useBuyRequests, useI18n } from '@mobazha/core';
import { getPaymentCoinDisplayLabel } from '@mobazha/core/data/tokens';
import type { BuyRequest } from '@mobazha/core';

const ALL_CATEGORIES = '__all__';

export default function WantedBoardPage() {
  const { t } = useI18n();
  const { requests, isLoading, error, refetch } = useBuyRequests();
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);

  // The board has no canonical category taxonomy yet, so the filter is built
  // from the categories actually present and applied client-side: a server-side
  // filter would shrink its own option list as soon as it was used.
  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const request of requests) {
      if (request.categorySlug) seen.add(request.categorySlug);
    }
    return Array.from(seen).sort();
  }, [requests]);

  const visible = useMemo(
    () =>
      category === ALL_CATEGORIES
        ? requests
        : requests.filter(request => request.categorySlug === category),
    [requests, category]
  );

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <Container size="xl" className="py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {t('wanted.boardTitle', { defaultValue: 'Wanted' })}
              </h1>
              <p className="text-muted-foreground">
                {t('wanted.boardSubtitle', {
                  defaultValue: 'Say what you need and sellers answer with offers.',
                })}
              </p>
            </div>
            <Button asChild>
              <Link href="/wanted/new">
                {t('wanted.postCta', { defaultValue: 'Post a request' })}
              </Link>
            </Button>
          </div>

          {categories.length > 1 && (
            <div className="mb-6 max-w-xs">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CATEGORIES}>
                    {t('wanted.filterAllCategories', { defaultValue: 'All categories' })}
                  </SelectItem>
                  {categories.map(slug => (
                    <SelectItem key={slug} value={slug}>
                      {slug}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <ErrorAlert
            error={typeof error === 'string' ? error : null}
            onRetry={() => void refetch()}
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              title={t('wanted.emptyTitle', { defaultValue: 'No requests yet' })}
              description={t('wanted.emptyBody', {
                defaultValue: 'Be the first to say what you are looking for.',
              })}
            />
          ) : (
            <Grid cols={4} colsMobile={2} colsTablet={3} gap="md">
              {visible.map(request => (
                <BuyRequestCard key={request.slug} request={request} />
              ))}
            </Grid>
          )}
        </Container>
      </div>
      <Footer />
    </>
  );
}

function BuyRequestCard({ request }: { request: BuyRequest }) {
  const { t } = useI18n();
  const budget = request.budget?.max;
  const cover = request.images?.[0];

  return (
    <Link href={`/wanted/${encodeURIComponent(request.slug)}`} className="block">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-square w-full bg-muted">
          {cover ? (
            <img
              src={getImageUrl(cover.small || cover.original)}
              alt={request.title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
              <ImageOff className="h-8 w-8" aria-hidden="true" />
            </div>
          )}
          <div className="absolute left-2 top-2">
            <BuyRequestStatusBadge status={request.status} />
          </div>
        </div>

        <CardContent className="flex flex-col gap-2 p-3">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">{request.title}</h3>

          <div className="flex items-center gap-1.5 text-primary">
            <span className="text-lg font-semibold leading-none">
              {budget ? budget.amount : '—'}
            </span>
            {budget && (
              <>
                <TokenIcon token={budget.currency} size={14} />
                <span className="text-xs font-medium">
                  {getPaymentCoinDisplayLabel(budget.currency) || budget.currency}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>
              {request.quantity}
              {request.unit ? ` ${request.unit}` : ''}
            </span>
            {request.deliverTo && <span>{request.deliverTo}</span>}
            <span>
              {t('wanted.offersTitle', { defaultValue: 'Offers' })} {request.offerCount}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
