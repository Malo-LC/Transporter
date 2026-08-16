import { useObservable } from 'micro-observables';
import type PlumeMessageResolver from './MessageResolver';
import type PlumeMessageResolverService from './MessageResolverService';

export default function useMessagesResolver(messageResolverService: PlumeMessageResolverService): PlumeMessageResolver {
  return useObservable(messageResolverService.getMessages());
}
