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
import { BuyRequestStatusBadge } from '@/components/wanted/BuyRequestStatusBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBuyRequests, useI18n } from '@mobazha/core';
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
            <Grid cols={3} colsMobile={1} colsTablet={2} gap="lg">
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

  return (
    <Link href={`/wanted/${encodeURIComponent(request.slug)}`} className="block">
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base line-clamp-2">{request.title}</h3>
            <BuyRequestStatusBadge status={request.status} />
          </div>

          {request.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
          )}

          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <dt>{t('wanted.newQuantity', { defaultValue: 'How many?' })}</dt>
            <dd className="text-right text-foreground">
              {request.quantity}
              {request.unit ? ` ${request.unit}` : ''}
            </dd>
            <dt>{t('wanted.newBudget', { defaultValue: 'Your maximum price' })}</dt>
            <dd className="text-right text-foreground">
              {budget
                ? `${budget.amount} ${getPaymentCoinDisplayLabel(budget.currency) || budget.currency}`
                : '—'}
            </dd>
            <dt>{t('wanted.newDeliverTo', { defaultValue: 'Deliver to' })}</dt>
            <dd className="text-right text-foreground">{request.deliverTo || '—'}</dd>
            <dt>{t('wanted.offersTitle', { defaultValue: 'Offers' })}</dt>
            <dd className="text-right text-foreground">{request.offerCount}</dd>
          </dl>
        </CardContent>
      </Card>
    </Link>
  );
}
