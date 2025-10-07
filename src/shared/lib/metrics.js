/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import client from 'prom-client';

// The prom-client register.
export const register = new client.Registry();

// Enable the collection of default metrics (CPU, memory, event loop lag, etc).
client.collectDefaultMetrics({ register });

// Define a custom histogram to measure the duration of HTTP requests.
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [50, 100, 200, 300, 400, 500, 750, 1000, 2000, 5000, 10000] // Buckets in milliseconds
});
register.registerMetric(httpRequestDurationMicroseconds);


// Define a custom counter for the total number of HTTP requests.
export const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'code']
});
register.registerMetric(httpRequestsTotal);