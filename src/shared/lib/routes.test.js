import { describe, it, expect } from 'vitest';
import { APP_ID_TO_SLUG, getAppPath, getAppIdFromPath } from './routes.js';

describe('routes helpers', () => {
  it('maps app ids to slugs', () => {
    expect(APP_ID_TO_SLUG.idealab).toBe('idealab');
    expect(APP_ID_TO_SLUG.calendarai).toBe('calendarai');
  });
  it('builds canonical paths', () => {
    expect(getAppPath('idealab')).toBe('/idealab');
    expect(getAppPath('planner','/nodes/123')).toBe('/planner/nodes/123');
  });
  it('extracts app id from path', () => {
    expect(getAppIdFromPath('/imagebooth/mode')).toBe('imagebooth');
    expect(getAppIdFromPath('/unknown')).toBe('idealab'); // default
  });
});
