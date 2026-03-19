import { EventEmitter } from 'events';

export const eventBus = new EventEmitter();

export const EVENTS = {
  TRACKER_LIVE: 'tracker:live',
  TRACKER_UNKNOWN: 'tracker:unknown',
};
