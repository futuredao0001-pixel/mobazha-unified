// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2026 fengzie and the respective contributors.

'use client';

import { type FormEvent, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header, Footer } from '@/components';
import { Container } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getPaymentCoinDisplayLabel } from '@mobazha/core/data/tokens';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorAlert } from '@/components/ui/error-alert';
import { BuyRequestStatusBadge } from '@/components/wanted/BuyRequestStatusBadge';
import { MessageBuyerButton } from '@/components/wanted/MessageBuyerButton';
import {
  getImageUrl,
  useAcceptBuyRequestOffer,
  useBuyRequestComments,
  useBuyRequestDetail,
  useCancelBuyRequest,
  useCreateBuyRequestComment,
  useCreateBuyRequestOffer,
  useI18n,
  useUserStore,
} from '@mobazha/core';
import type { BuyRequestComment, BuyRequestOffer } from '@mobazha/core';

const OPEN_STATUS = 'open';

function shortPeer(peerID: string): string {
  if (!peerID) return '';
  return peerID.length > 14 ? `${peerID.slice(0, 14)}…` : peerID;
}

export default function BuyRequestDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const { profile } = useUserStore();

  const { request, offers, isLoading, error, refetch } = useBuyRequestDetail(slug || null);
  const acceptOffer = useAcceptBuyRequestOffer(slug);
  const cancelRequest = useCancelBuyRequest(slug);
  const [actionFailed, setActionFailed] = useState(false);

  const isBuyer = !!request && !!profile?.peerID && request.buyerID.peerID === profile.peerID;
  const isOpen = request?.status === OPEN_STATUS;
  const budget = request?.budget?.max;

  const handleAccept = async (offerID: string) => {
    setActionFailed(false);
    try {
      await acceptOffer.mutateAsync(offerID);
    } catch {
      setActionFailed(true);
    }
  };

  const handleCancel = async () => {
    setActionFailed(false);
    try {
      await cancelRequest.mutateAsync();
    } catch {
      setActionFailed(true);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <Container size="lg" className="py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : !request ? (
            <>
              <ErrorAlert
                error={typeof error === 'string' ? error : null}
                onRetry={() => void refetch()}
              />
              <EmptyState
                title={t('wanted.emptyTitle', { defaultValue: 'No requests yet' })}
                description={t('wanted.errorLoad', {
                  defaultValue: 'Could not load requests. Please try again.',
                })}
              />
            </>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-3xl font-bold">{request.title}</h1>
                  <BuyRequestStatusBadge status={request.status} />
                </div>
                {request.description && (
                  <p className="text-muted-foreground whitespace-pre-line">{request.description}</p>
                )}
              </div>

              {request.images && request.images.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {request.images.map((image, index) => {
                    const src = getImageUrl(image.large || image.original);
                    return src ? (
                      <img
                        key={`${image.original}-${index}`}
                        src={src}
                        alt={request.title}
                        loading="lazy"
                        className="h-40 w-40 rounded-md border border-border object-cover"
                      />
                    ) : null;
                  })}
                </div>
              )}

              <Card>
                <CardContent className="p-6">
                  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                    <dt className="text-muted-foreground">
                      {t('wanted.newQuantity', { defaultValue: 'How many?' })}
                    </dt>
                    <dd>
                      {request.quantity}
                      {request.unit ? ` ${request.unit}` : ''}
                    </dd>
                    <dt className="text-muted-foreground">
                      {t('wanted.newBudget', { defaultValue: 'Your maximum price' })}
                    </dt>
                    <dd>
                      {budget
                        ? `${budget.amount} ${getPaymentCoinDisplayLabel(budget.currency) || budget.currency}`
                        : '—'}
                    </dd>
                    <dt className="text-muted-foreground">
                      {t('wanted.newCurrencies', { defaultValue: 'Accepted currencies' })}
                    </dt>
                    <dd>
                      {request.acceptedCurrencies
                        .map(code => getPaymentCoinDisplayLabel(code) || code)
                        .join(', ')}
                    </dd>
                    <dt className="text-muted-foreground">
                      {t('wanted.newDeliverTo', { defaultValue: 'Deliver to' })}
                    </dt>
                    <dd>{request.deliverTo || '—'}</dd>
                    <dt className="text-muted-foreground">
                      {t('wanted.newCategory', { defaultValue: 'Category' })}
                    </dt>
                    <dd>{request.categorySlug || '—'}</dd>
                  </dl>
                </CardContent>
              </Card>

              <ErrorAlert
                error={
                  actionFailed
                    ? t('wanted.errorOffer', {
                        defaultValue: 'Could not send the offer. Please try again.',
                      })
                    : null
                }
              />

              {isBuyer && isOpen && (
                <div>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={cancelRequest.isPending}
                  >
                    {t('wanted.closeRequest', { defaultValue: 'Close request' })}
                  </Button>
                </div>
              )}

              {!isBuyer && <MessageBuyerButton buyerPeerID={request.buyerID.peerID} />}

              <section className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold">
                  {t('wanted.offersTitle', { defaultValue: 'Offers' })}
                </h2>
                {offers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t('wanted.offersEmpty', {
                      defaultValue: 'No offers yet. Sellers answer here.',
                    })}
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {offers.map(offer => (
                      <OfferRow
                        key={offer.id}
                        offer={offer}
                        canAccept={isBuyer && isOpen}
                        accepting={acceptOffer.isPending}
                        onAccept={handleAccept}
                      />
                    ))}
                  </div>
                )}
              </section>

              {!isBuyer && isOpen && (
                <OfferForm slug={slug} acceptedCurrencies={request.acceptedCurrencies} />
              )}

              <CommentsSection slug={slug} canComment={isOpen || request.status === 'locked'} />
            </div>
          )}
        </Container>
      </div>
      <Footer />
    </>
  );
}

function OfferRow({
  offer,
  canAccept,
  accepting,
  onAccept,
}: {
  offer: BuyRequestOffer;
  canAccept: boolean;
  accepting: boolean;
  onAccept: (offerID: string) => void;
}) {
  const { t } = useI18n();
  const accepted = offer.status === 'accepted';
  const rejected = offer.status === 'rejected';

  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-semibold">
              {offer.unitPrice.amount}{' '}
              {getPaymentCoinDisplayLabel(offer.unitPrice.currency) || offer.unitPrice.currency}
            </span>
            <span className="text-xs text-muted-foreground">
              {shortPeer(offer.sellerID.peerID)}
            </span>
          </div>
          {accepted && (
            <Badge variant="secondary">
              {t('wanted.statusLocked', { defaultValue: 'Offer accepted' })}
            </Badge>
          )}
          {rejected && (
            <Badge variant="outline">
              {t('wanted.statusCancelled', { defaultValue: 'Closed' })}
            </Badge>
          )}
        </div>

        <dl className="grid grid-cols-3 gap-x-4 text-xs text-muted-foreground">
          <dt>{t('wanted.offerQuantity', { defaultValue: 'Quantity' })}</dt>
          <dt>{t('wanted.offerLeadTime', { defaultValue: 'Ships in (days)' })}</dt>
          <dt>{t('wanted.offerShipsFrom', { defaultValue: 'Ships from' })}</dt>
          <dd className="text-foreground">{offer.quantity}</dd>
          <dd className="text-foreground">{offer.leadTimeDays}</dd>
          <dd className="text-foreground">{offer.shipsFrom || '—'}</dd>
        </dl>

        {offer.note && <p className="text-sm text-muted-foreground">{offer.note}</p>}

        {canAccept && offer.status === 'submitted' && (
          <Button onClick={() => onAccept(offer.id)} disabled={accepting}>
            {t('wanted.offerAccept', { defaultValue: 'Accept this offer' })}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function OfferForm({ slug, acceptedCurrencies }: { slug: string; acceptedCurrencies: string[] }) {
  const { t } = useI18n();
  const createOffer = useCreateBuyRequestOffer(slug);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState(acceptedCurrencies[0] ?? '');
  const [quantity, setQuantity] = useState('1');
  const [leadTimeDays, setLeadTimeDays] = useState('3');
  const [shipsFrom, setShipsFrom] = useState('');
  const [note, setNote] = useState('');
  const [failed, setFailed] = useState(false);

  const canSubmit = price.trim().length > 0 && currency.trim().length > 0;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFailed(false);
    const parsedQuantity = Number.parseInt(quantity, 10);
    try {
      await createOffer.mutateAsync({
        unitPrice: { amount: price.trim(), currency },
        quantity: Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1,
        leadTimeDays: Number.parseInt(leadTimeDays, 10) || 0,
        shipsFrom: shipsFrom.trim().toUpperCase(),
        note: note.trim(),
      });
      setPrice('');
      setNote('');
    } catch {
      setFailed(true);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <h2 className="text-xl font-semibold">
            {t('wanted.offerFormTitle', { defaultValue: 'Your offer' })}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="offer-price">
                {t('wanted.offerPrice', { defaultValue: 'Price' })}
              </Label>
              <Input
                id="offer-price"
                inputMode="decimal"
                value={price}
                onChange={event => setPrice(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="offer-currency">
                {t('wanted.newCurrencies', { defaultValue: 'Accepted currencies' })}
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="offer-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {acceptedCurrencies.map(code => (
                    <SelectItem key={code} value={code}>
                      {getPaymentCoinDisplayLabel(code) || code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="offer-quantity">
                {t('wanted.offerQuantity', { defaultValue: 'Quantity' })}
              </Label>
              <Input
                id="offer-quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={event => setQuantity(event.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="offer-lead">
                {t('wanted.offerLeadTime', { defaultValue: 'Ships in (days)' })}
              </Label>
              <Input
                id="offer-lead"
                type="number"
                min={0}
                value={leadTimeDays}
                onChange={event => setLeadTimeDays(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="offer-ships-from">
                {t('wanted.offerShipsFrom', { defaultValue: 'Ships from' })}
              </Label>
              <Input
                id="offer-ships-from"
                value={shipsFrom}
                onChange={event => setShipsFrom(event.target.value)}
                maxLength={2}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="offer-note">
              {t('wanted.offerNote', { defaultValue: 'Why your offer is better (optional)' })}
            </Label>
            <textarea
              id="offer-note"
              value={note}
              onChange={event => setNote(event.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <ErrorAlert
            error={
              failed
                ? t('wanted.errorOffer', {
                    defaultValue: 'Could not send the offer. Please try again.',
                  })
                : null
            }
          />

          <Button type="submit" disabled={!canSubmit || createOffer.isPending}>
            {createOffer.isPending
              ? t('wanted.offerSubmitting', { defaultValue: 'Sending...' })
              : t('wanted.offerSubmit', { defaultValue: 'Send offer' })}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CommentsSection({ slug, canComment }: { slug: string; canComment: boolean }) {
  const { t } = useI18n();
  const { comments, total, isLoading } = useBuyRequestComments(slug);
  const createComment = useCreateBuyRequestComment(slug);

  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<BuyRequestComment | null>(null);
  const [failed, setFailed] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    setFailed(false);
    try {
      await createComment.mutateAsync({
        body: text,
        ...(replyTo ? { parentCommentID: replyTo.id } : {}),
      });
      setBody('');
      setReplyTo(null);
    } catch {
      setFailed(true);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">
        {t('wanted.commentsTitle', { defaultValue: 'Comments' })}
        {total > 0 ? ` (${total})` : ''}
      </h2>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('wanted.commentsEmpty', { defaultValue: 'No comments yet.' })}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.map(comment => (
            <div key={comment.id} className="flex flex-col gap-2">
              <CommentRow
                comment={comment}
                canReply={canComment}
                onReply={() => setReplyTo(comment)}
              />
              {(comment.replies ?? []).length > 0 && (
                <div className="ml-6 flex flex-col gap-2 border-l border-border pl-3">
                  {(comment.replies ?? []).map(reply => (
                    <CommentRow key={reply.id} comment={reply} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {canComment ? (
        <form onSubmit={submit} className="flex flex-col gap-2">
          {replyTo && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {t('wanted.commentReplyingTo', { defaultValue: 'Replying to' })}{' '}
                {shortPeer(replyTo.authorID.peerID)}
              </span>
              <button type="button" className="underline" onClick={() => setReplyTo(null)}>
                {t('wanted.commentCancelReply', { defaultValue: 'Cancel' })}
              </button>
            </div>
          )}
          <textarea
            id="wanted-comment"
            value={body}
            onChange={event => setBody(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={t('wanted.commentPlaceholder', {
              defaultValue: 'Ask a question or add a detail…',
            })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <ErrorAlert
            error={
              failed
                ? t('wanted.errorComment', {
                    defaultValue: 'Could not post the comment. Please try again.',
                  })
                : null
            }
          />
          <Button type="submit" disabled={!body.trim() || createComment.isPending}>
            {createComment.isPending
              ? t('wanted.commentSubmitting', { defaultValue: 'Posting...' })
              : t('wanted.commentSubmit', { defaultValue: 'Post comment' })}
          </Button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t('wanted.commentClosed', {
            defaultValue: 'This request is closed, so its thread is read-only.',
          })}
        </p>
      )}
    </section>
  );
}

function CommentRow({
  comment,
  canReply,
  onReply,
}: {
  comment: BuyRequestComment;
  canReply?: boolean;
  onReply?: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="rounded-md border border-border p-3 flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{shortPeer(comment.authorID.peerID)}</span>
        <span>{new Date(comment.createdAt).toLocaleString()}</span>
      </div>
      <p className="text-sm whitespace-pre-line">{comment.body}</p>
      {canReply && onReply && (
        <button type="button" className="self-start text-xs underline" onClick={onReply}>
          {t('wanted.commentReply', { defaultValue: 'Reply' })}
        </button>
      )}
    </div>
  );
}
