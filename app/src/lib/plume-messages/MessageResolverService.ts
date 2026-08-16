import type { Observable } from 'micro-observables';
import type PlumeMessageResolver from './MessageResolver';

/**
 * Return the observable message interface
 */
export default abstract class PlumeMessageResolverService {
  abstract getMessages(): Observable<PlumeMessageResolver>;
}
