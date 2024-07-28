import { AsyncResource } from 'node:async_hooks';
import { Readable } from 'node:stream';

import { AnyFn } from './types.js';

/**
 * Invoke callback when the response has finished, useful for
 * cleaning up resources afterwards.
 */
export function onFinished(stream: Readable, listener: AnyFn) {
  if (isFinished(stream) !== false) {
    setImmediate(listener, null, stream);
    return stream;
  }

  stream.once('end', wrap(listener));

  return stream;
}

/**
 * Wrap function with async resource, if possible.
 * AsyncResource.bind static method backported.
 */
function wrap(fn: AnyFn) {
  const resource = new AsyncResource(fn.name || 'bound-anonymous-fn');

  // return bound function
  return resource.runInAsyncScope.bind(resource, fn, null);
}

export function isFinished(stream: any) {
  const socket = stream.socket;

  if (typeof stream.finished === 'boolean') {
    // OutgoingMessage
    return Boolean(stream.finished || (socket && !socket.writable));
  }

  if (typeof stream.complete === 'boolean') {
    // IncomingMessage
    return Boolean(stream.upgrade || !socket || !socket.readable || (stream.complete && !stream.readable));
  }

  // don't know
  return undefined;
}
