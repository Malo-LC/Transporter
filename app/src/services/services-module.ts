import NotificationEngine from '@lib/plume-notification/NotificationEngine';
import ObservableNotificationEngine from '@lib/plume-notification/ObservableNotificationEngine';
import { BrowserUserActivityListener, IdlenessDetector, UserActivityListener } from 'browser-user-session';
import { Injector } from 'plume-ts-di';
import { Scheduler } from 'simple-job-scheduler';
import SessionService from './session/SessionService';

export default function installServicesModule(injector: Injector) {
  // browser dependent services
  injector.registerSingleton(BrowserUserActivityListener, UserActivityListener);
  // other services
  injector.registerSingleton(IdlenessDetector);
  injector.registerSingleton(SessionService);
  injector.registerSingleton(ObservableNotificationEngine);
  injector.registerSingleton(ObservableNotificationEngine, NotificationEngine);
  injector.registerSingleton(Scheduler);
}
