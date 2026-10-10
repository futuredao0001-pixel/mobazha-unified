// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 fengzie and the respective contributors.

'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Footer, AuthGuard } from '@/components';
import { Container } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorAlert } from '@/components/ui/error-alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateBuyRequest, useI18n } from '@mobazha/core';
import {
  TOKENS,
  getPaymentCoinDisplayLabel,
  isPaymentCoinEnabled,
} from '@mobazha/core/data/tokens';
import type { CreateBuyRequestRequest } from '@mobazha/core';

// Settleable coins come from the platform token registry rather than a
// hand-written list, so the board can only ever quote currencies the node can
// actually settle. Ordering keeps the native coins first, which is what most
// buyers reach for.
const SETTLEABLE_COINS = TOKENS.filter(token => isPaymentCoinEnabled(token.id))
  .map(token => {
    const display = getPaymentCoinDisplayLabel(token.id) || token.id;
    // Stablecoins exist on several chains and share a display label, so the
    // chain is what makes the options distinguishable in the picker.
    return {
      id: token.id,
      label: display === token.id ? display : `${display} · ${token.chain}`,
    };
  })
  .filter((coin, index, all) => all.findIndex(c => c.id === coin.id) === index)
  .sort((a, b) => {
    const aNative = a.id === a.label ? 0 : 1;
    const bNative = b.id === b.label ? 0 : 1;
    if (aNative !== bNative) return aNative - bNative;
    return a.id.localeCompare(b.id);
  });

const DEFAULT_COIN =
  SETTLEABLE_COINS.find(c => c.id === 'ETHUSDT')?.id ?? SETTLEABLE_COINS[0]?.id ?? 'BTC';

export default function NewWantedRequestPage() {
  return (
    <AuthGuard>
      <NewWantedRequestForm />
    </AuthGuard>
  );
}

function NewWantedRequestForm() {
  const { t } = useI18n();
  const router = useRouter();
  const createRequest = useCreateBuyRequest();

  const [title, setTitle] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState(DEFAULT_COIN);
  const [alsoAccept, setAlsoAccept] = useState<string[]>([]);
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [deliverTo, setDeliverTo] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [description, setDescription] = useState('');
  const [submitFailed, setSubmitFailed] = useState(false);

  const acceptedCurrencies = useMemo(
    () => Array.from(new Set([budgetCurrency, ...alsoAccept])).filter(Boolean),
    [budgetCurrency, alsoAccept]
  );

  const canSubmit =
    title.trim().length > 0 && budgetAmount.trim().length > 0 && deliverTo.trim().length > 0;

  const toggleCoin = (id: string) => {
    setAlsoAccept(prev => (prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitFailed(false);

    const parsedQuantity = Number.parseInt(quantity, 10);
    const payload: CreateBuyRequestRequest = {
      title: title.trim(),
      quantity: Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1,
      budgetMax: { amount: budgetAmount.trim(), currency: budgetCurrency },
      expiresInDays: Number.parseInt(expiresInDays, 10) || 7,
      acceptedCurrencies,
      deliverTo: deliverTo.trim().toUpperCase(),
    };
    if (categorySlug.trim()) payload.categorySlug = categorySlug.trim();
    if (description.trim()) payload.description = description.trim();

    try {
      const created = await createRequest.mutateAsync(payload);
      router.push(`/wanted/${encodeURIComponent(created.slug)}`);
    } catch {
      setSubmitFailed(true);
    }
  };

  const publishError = submitFailed
    ? t('wanted.errorPublish', {
        defaultValue: 'Could not publish the request. Please try again.',
      })
    : null;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <Container size="md" className="py-8">
          <h1 className="text-3xl font-bold mb-8">
            {t('wanted.newTitle', { defaultValue: 'What are you looking for?' })}
          </h1>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="wanted-title">
                    {t('wanted.newTitle', { defaultValue: 'What are you looking for?' })}
                  </Label>
                  <Input
                    id="wanted-title"
                    value={title}
                    onChange={event => setTitle(event.target.value)}
                    required
                    maxLength={140}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="wanted-quantity">
                      {t('wanted.newQuantity', { defaultValue: 'How many?' })}
                    </Label>
                    <Input
                      id="wanted-quantity"
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={event => setQuantity(event.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="wanted-expires">
                      {t('wanted.newExpiresDays', { defaultValue: 'Keep it up for (days)' })}
                    </Label>
                    <Input
                      id="wanted-expires"
                      type="number"
                      min={1}
                      max={365}
                      value={expiresInDays}
                      onChange={event => setExpiresInDays(event.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="wanted-budget">
                      {t('wanted.newBudget', { defaultValue: 'Your maximum price' })}
                    </Label>
                    <Input
                      id="wanted-budget"
                      inputMode="decimal"
                      value={budgetAmount}
                      onChange={event => setBudgetAmount(event.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="wanted-currency">
                      {t('wanted.newBudgetCurrency', { defaultValue: 'Budget currency' })}
                    </Label>
                    <Select value={budgetCurrency} onValueChange={setBudgetCurrency}>
                      <SelectTrigger id="wanted-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SETTLEABLE_COINS.map(coin => (
                          <SelectItem key={coin.id} value={coin.id}>
                            {coin.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>
                    {t('wanted.newCurrencies', { defaultValue: 'Accepted currencies' })}
                  </Label>
                  <div className="max-h-48 overflow-y-auto rounded-md border border-input p-3 flex flex-wrap gap-2">
                    {SETTLEABLE_COINS.map(coin => {
                      const checked = acceptedCurrencies.includes(coin.id);
                      const locked = coin.id === budgetCurrency;
                      return (
                        <label
                          key={coin.id}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                            checked
                              ? 'border-primary text-foreground'
                              : 'border-input text-muted-foreground'
                          } ${locked ? 'opacity-70' : 'cursor-pointer'}`}
                        >
                          <input
                            type="checkbox"
                            className="h-3 w-3"
                            checked={checked}
                            disabled={locked}
                            onChange={() => toggleCoin(coin.id)}
                          />
                          {coin.label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="wanted-deliver">
                      {t('wanted.newDeliverTo', { defaultValue: 'Deliver to' })}
                    </Label>
                    <Input
                      id="wanted-deliver"
                      value={deliverTo}
                      onChange={event => setDeliverTo(event.target.value)}
                      maxLength={2}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="wanted-category">
                      {t('wanted.newCategory', { defaultValue: 'Category' })}
                    </Label>
                    <Input
                      id="wanted-category"
                      value={categorySlug}
                      onChange={event => setCategorySlug(event.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="wanted-details">
                    {t('wanted.newDetails', { defaultValue: 'Details (optional)' })}
                  </Label>
                  <textarea
                    id="wanted-details"
                    value={description}
                    onChange={event => setDescription(event.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <ErrorAlert error={publishError} />

                <Button type="submit" disabled={!canSubmit || createRequest.isPending}>
                  {createRequest.isPending
                    ? t('wanted.newSubmitting', { defaultValue: 'Publishing...' })
                    : t('wanted.newSubmit', { defaultValue: 'Publish request' })}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Container>
      </div>
      <Footer />
    </>
  );
}
