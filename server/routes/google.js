import express from 'express';
import { requireAuth } from '../../src/shared/lib/auth.js';
import logger from '../../src/shared/lib/logger.js';
import { ensureGoogleAccessToken } from '../../src/shared/lib/secureTokens.js';

export default function createGoogleServicesRouter() {
  const router = express.Router();

  // Google Drive: list files
  router.get('/services/googleDrive/files', requireAuth, async (req, res) => {
    try {
      const { folderId = 'root', q = '', pageToken = '' } = req.query;
      const accessToken = await ensureGoogleAccessToken(req.user.email, 'googleDrive', { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET });
      if (!accessToken) return res.status(400).json({ error: 'Google Drive not connected' });

      const params = new URLSearchParams();
      const baseQuery = folderId === 'root' ? `'root' in parents` : `'${folderId}' in parents`;
      const query = [baseQuery, 'trashed = false', q ? `name contains '${String(q).replace(/'/g, "\\'")}'` : ''].filter(Boolean).join(' and ');
      params.set('q', query);
      params.set('orderBy', 'modifiedTime desc');
      params.set('pageSize', '50');
      if (pageToken) params.set('pageToken', pageToken);
      params.set('fields', 'files(id,name,mimeType,modifiedTime,size,iconLink,thumbnailLink,webViewLink,parents),nextPageToken');

      const url = `https://www.googleapis.com/drive/v3/files?${params.toString()}`;
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!resp.ok) {
        const text = await resp.text();
        return res.status(resp.status).json({ error: 'Drive API error', details: text });
      }
      const json = await resp.json();
      const items = (json.files || []).map((f) => ({ id: f.id, name: f.name, kind: f.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file', mimeType: f.mimeType, modifiedTime: f.modifiedTime, size: f.size, icon: f.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'description', thumbnailLink: f.thumbnailLink, webViewLink: f.webViewLink, parents: f.parents || [] }));
      res.json({ files: items, nextPageToken: json.nextPageToken || null });
    } catch (err) {
      logger.error('Drive list error:', err);
      res.status(500).json({ error: 'Failed to list Drive files', details: err.message });
    }
  });

  // Google Photos: list albums
  router.get('/services/googlePhotos/albums', requireAuth, async (req, res) => {
    try {
      const accessToken = await ensureGoogleAccessToken(req.user.email, 'googlePhotos', { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET });
      if (!accessToken) return res.status(400).json({ error: 'Google Photos not connected' });
      const params = new URLSearchParams({ pageSize: '50' });
      const resp = await fetch(`https://photoslibrary.googleapis.com/v1/albums?${params.toString()}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!resp.ok) {
        const text = await resp.text();
        return res.status(resp.status).json({ error: 'Photos API error', details: text });
      }
      const json = await resp.json();
      const items = (json.albums || []).map((a) => ({ id: a.id, title: a.title, count: Number(a.mediaItemsCount || 0), coverPhotoBaseUrl: a.coverPhotoBaseUrl || null }));
      res.json({ albums: items, nextPageToken: json.nextPageToken || null });
    } catch (err) {
      logger.error('Photos albums error:', err);
      res.status(500).json({ error: 'Failed to list Photos albums', details: err.message });
    }
  });

  // Google Photos: list media items in album
  router.get('/services/googlePhotos/mediaItems', requireAuth, async (req, res) => {
    try {
      const { albumId, pageToken = '' } = req.query;
      const accessToken = await ensureGoogleAccessToken(req.user.email, 'googlePhotos', { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET });
      if (!accessToken) return res.status(400).json({ error: 'Google Photos not connected' });
      if (!albumId) return res.status(400).json({ error: 'albumId is required' });
      const body = { albumId, pageSize: 50 };
      if (pageToken) body.pageToken = pageToken;
      const resp = await fetch(`https://photoslibrary.googleapis.com/v1/mediaItems:search`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!resp.ok) {
        const text = await resp.text();
        return res.status(resp.status).json({ error: 'Photos API error', details: text });
      }
      const json = await resp.json();
      const items = (json.mediaItems || []).map((m) => ({ id: m.id, mimeType: m.mimeType, filename: m.filename, baseUrl: m.baseUrl, description: m.description || '' }));
      res.json({ mediaItems: items, nextPageToken: json.nextPageToken || null });
    } catch (err) {
      logger.error('Photos mediaItems error:', err);
      res.status(500).json({ error: 'Failed to list Photos media items', details: err.message });
    }
  });

  // Gmail: list messages (INBOX)
  router.get('/services/gmail/messages', requireAuth, async (req, res) => {
    try {
      const { maxResults = '10', q = '', labelIds = 'INBOX' } = req.query;
      const accessToken = await ensureGoogleAccessToken(req.user.email, 'gmail', { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET });
      if (!accessToken) return res.status(400).json({ error: 'Gmail not connected' });
      const listParams = new URLSearchParams({ maxResults: String(maxResults), labelIds, q });
      const listResp = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${listParams.toString()}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!listResp.ok) {
        const text = await listResp.text();
        return res.status(listResp.status).json({ error: 'Gmail API error', details: text });
      }
      const listJson = await listResp.json();
      const ids = (listJson.messages || []).map((m) => m.id);
      const results = [];
      for (const id of ids) {
        const msgResp = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date&metadataHeaders=To`, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!msgResp.ok) continue;
        const msg = await msgResp.json();
        const headers = Object.fromEntries((msg.payload?.headers || []).map(h => [h.name, h.value]));
        results.push({ id: msg.id, threadId: msg.threadId, snippet: msg.snippet, subject: headers.Subject || '(no subject)', from: headers.From || '', to: headers.To || '', date: headers.Date || '', labelIds: msg.labelIds || [], unread: (msg.labelIds || []).includes('UNREAD') });
      }
      res.json({ messages: results });
    } catch (err) {
      logger.error('Gmail list error:', err);
      res.status(500).json({ error: 'Failed to list Gmail messages', details: err.message });
    }
  });

  // Google Calendar: list events
  router.get('/services/googleCalendar/events', requireAuth, async (req, res) => {
    try {
      const { maxResults = '50', timeMin, timeMax, q = '' } = req.query;
      const accessToken = await ensureGoogleAccessToken(req.user.email, 'googleCalendar', { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET });
      if (!accessToken) return res.status(400).json({ error: 'Google Calendar not connected' });
      const params = new URLSearchParams({ maxResults: String(maxResults), orderBy: 'startTime', singleEvents: 'true', timeMin: timeMin || new Date().toISOString() });
      if (timeMax) params.set('timeMax', timeMax);
      if (q) params.set('q', q);
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`;
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!resp.ok) {
        const text = await resp.text();
        return res.status(resp.status).json({ error: 'Calendar API error', details: text });
      }
      const json = await resp.json();
      const events = (json.items || []).map((event) => ({ id: event.id, summary: event.summary || '(No title)', description: event.description || '', location: event.location || '', start: event.start?.dateTime || event.start?.date, end: event.end?.dateTime || event.end?.date, htmlLink: event.htmlLink, creator: event.creator, organizer: event.organizer, attendees: event.attendees || [], status: event.status, colorId: event.colorId, attachments: event.attachments || [] }));
      res.json({ events, nextPageToken: json.nextPageToken || null });
    } catch (err) {
      logger.error('Calendar list error:', err);
      res.status(500).json({ error: 'Failed to list Calendar events', details: err.message });
    }
  });

  return router;
}
