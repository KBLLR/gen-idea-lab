/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  // Standard structured JSON format for Loki/Promtail
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Log to the console. In a containerized environment, an agent like Promtail
    // will scrape logs from stdout.
    new winston.transports.Console(),
  ],
});

export default logger;