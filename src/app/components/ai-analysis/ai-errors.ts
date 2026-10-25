import {TranslateService} from '@ngx-translate/core';
import {serverMessage} from '../../helpers/error.interceptor';

/**
 * Refusals of the AI analysis the backend explains in English, matched by a
 * fragment of their text, with the sentence that tells the admin what to do.
 */
const KNOWN_ERRORS: ReadonlyArray<[fragment: string, key: string]> = [
  ['openai api key not configured', 'aiAnalysis.errors.known.noKey'],
  ['monthly budget', 'aiAnalysis.errors.known.budget'],
  ['already running', 'aiAnalysis.errors.known.busy'],
  ['no enabled subscribers', 'aiAnalysis.errors.known.noSubscribers'],
  ['mail service not configured', 'aiAnalysis.errors.known.noMail'],
  ['service is stopping', 'aiAnalysis.errors.known.stopping'],
  ['interrupted', 'aiAnalysis.errors.known.interrupted'],
  ['unknown model', 'aiAnalysis.errors.known.unknownModel'],
  ['time zone', 'aiAnalysis.errors.known.timeZone'],
];

/** The admin's version of a backend explanation; unknown ones stay as they are. */
export function explainAIError(text: string, translate: TranslateService): string {
  const lower = text.toLowerCase();
  const known = KNOWN_ERRORS.find(([fragment]) => lower.includes(fragment));
  return known ? translate.instant(known[1]) : text;
}

/** "Could not start the analysis: <why>" for a failed request. */
export function explainRequestError(err: unknown, failedKey: string, translate: TranslateService): string {
  const message = serverMessage(err);
  const reason = message ? explainAIError(message, translate) : translate.instant('aiAnalysis.errors.known.unreachable');
  return translate.instant(failedKey, {error: reason});
}
