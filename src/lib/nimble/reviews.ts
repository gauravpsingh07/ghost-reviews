import type { Review, SourceId } from "@/types";
import { normalizeReviews, type RawReview } from "@/lib/engine/normalize";
import type { RawReviewContentPage } from "./content";

const TEXT_KEYS = [
  "text",
  "reviewText",
  "review_text",
  "reviewBody",
  "review_body",
  "content",
  "body",
  "comment",
  "description",
];
const RATING_KEYS = ["rating", "stars", "score", "ratingValue", "reviewRating"];
const DATE_KEYS = [
  "date",
  "publishedDate",
  "published_at",
  "datePublished",
  "date_published",
  "createdAt",
  "created_at",
];
const AUTHOR_KEYS = ["author", "authorName", "author_name", "user", "username", "name"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number") return String(value);
  if (isRecord(value) && typeof value.name === "string") return value.name.trim() || undefined;
  return undefined;
}

function findValue(record: Record<string, unknown>, keys: string[]): unknown {
  const lowerKeyMap = new Map(Object.keys(record).map((key) => [key.toLowerCase(), key]));
  for (const key of keys) {
    const actual = lowerKeyMap.get(key.toLowerCase());
    if (actual) return record[actual];
  }
  return undefined;
}

function parseRating(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (isRecord(value)) {
    return parseRating(value.ratingValue ?? value.rating ?? value.value ?? value.score);
  }
  if (typeof value !== "string") return undefined;
  const match = value.match(/([1-5](?:\.\d)?)(?:\s*(?:\/\s*5|stars?|★))?/i);
  return match ? Number(match[1]) : undefined;
}

function reviewFromRecord(record: Record<string, unknown>, source: SourceId): RawReview | undefined {
  const text = stringValue(findValue(record, TEXT_KEYS));
  const rating = parseRating(findValue(record, RATING_KEYS));
  if (!text || text.length < 12 || rating === undefined) return undefined;

  return {
    source,
    text,
    rating,
    author: stringValue(findValue(record, AUTHOR_KEYS)),
    date: stringValue(findValue(record, DATE_KEYS)),
    verifiedPurchase:
      typeof record.verifiedPurchase === "boolean" ? record.verifiedPurchase : undefined,
  };
}

function collectStructuredReviews(value: unknown, source: SourceId, out: RawReview[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectStructuredReviews(item, source, out);
    return;
  }

  if (!isRecord(value)) return;

  const review = reviewFromRecord(value, source);
  if (review) out.push(review);

  for (const child of Object.values(value)) {
    if (Array.isArray(child) || isRecord(child)) collectStructuredReviews(child, source, out);
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ");
}

function parseTextReviewBlocks(text: string, source: SourceId): RawReview[] {
  const blocks = text
    .split(/\n{2,}|-{3,}/)
    .map((block) => block.trim())
    .filter((block) => block.replace(/\s+/g, " ").trim().length >= 20);

  const reviews: RawReview[] = [];
  for (const block of blocks) {
    const compact = block.replace(/\s+/g, " ").trim();
    const rating =
      parseRating(compact.match(/\b(?:rating|stars?)\s*[:\-]?\s*([1-5](?:\.\d)?)/i)?.[1]) ??
      parseRating(compact.match(/\b([1-5](?:\.\d)?)\s*(?:\/\s*5|stars?|★)/i)?.[0]);
    if (rating === undefined) continue;

    const author = block.match(/(?:^|\n)\s*(?:by|author)\s*[:\-]\s*([^\n|.]{2,60})/i)?.[1]?.trim();
    const date = compact.match(/\b(20\d{2}-\d{2}-\d{2}|[A-Z][a-z]+ \d{1,2}, 20\d{2})\b/)?.[1];
    const cleaned = block
      .replace(/\b(?:rating|stars?)\s*[:\-]?\s*[1-5](?:\.\d)?(?:\s*(?:\/\s*5|stars?|★))?/i, "")
      .replace(/\b[1-5](?:\.\d)?\s*(?:\/\s*5|stars?|★)/i, "")
      .replace(/(?:^|\n)\s*(?:by|author)\s*[:\-]\s*([^\n|.]{2,60})/i, "")
      .replace(/\s+/g, " ")
      .trim();

    if (cleaned.length >= 12) reviews.push({ source, rating, text: cleaned, author, date });
  }

  return reviews;
}

export function rawReviewsFromNimbleContent(page: RawReviewContentPage): RawReview[] {
  const raw: RawReview[] = [];
  collectStructuredReviews(page.parsing, page.source, raw);

  if (raw.length > 0) return raw;

  const text = page.markdown ?? (page.html ? stripHtml(page.html) : "");
  return parseTextReviewBlocks(text, page.source);
}

export function mapRawNimbleOutputToReviews(pages: RawReviewContentPage[]): Review[] {
  const raw = pages.flatMap((page) => rawReviewsFromNimbleContent(page));
  return normalizeReviews(raw);
}
