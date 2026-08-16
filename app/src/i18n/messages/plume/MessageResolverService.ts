import type PlumeMessageResolver from '@lib/plume-messages/MessageResolver';
import type PlumeMessageResolverService from '@lib/plume-messages/MessageResolverService';
import type { Observable } from 'micro-observables';
import type { Translations } from '../../translations/Translations';
import type MessageService from '../MessageService';
import MessageResolver from './MessageResolver';

/**
 * {@link PlumeMessageResolver} implementation
 * It allows to expose the message handling API in the Plume administration theme components
 */
export default class MessageResolverService implements PlumeMessageResolverService {
  private messageResolver: Observable<MessageResolver>;

  constructor(private readonly messageService: MessageService) {
    this.messageResolver = this.messageService.getMessages().select((messages: Translations) => new MessageResolver(messages));
  }

  getMessages(): Observable<PlumeMessageResolver> {
    return this.messageResolver;
  }
}
