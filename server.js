import { createServer } from 'node:http';
import { heroImage, profileStats, profileInterests, matchingGroupCards, storyItems, chatMessages, partnerProfile } from './src/data/mockData.js';

const PORT = process.env.API_PORT || 4000;

const routes = {
  '/api/profile': () => ({
    heroImage,
    stats: profileStats,
    interests: profileInterests,
  }),
  '/api/groups': () => matchingGroupCards,
  '/api/stories': () => storyItems,
  '/api/messages': () => chatMessages,
  '/api/partner': () => partnerProfile,
  '/api/feed': () => ({
    heroImage,
    stats: profileStats,
    interests: profileInterests,
    groups: matchingGroupCards,
    stories: storyItems,
    messages: chatMessages,
    partner: partnerProfile,
  }),
};

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, buildHeaders());
    res.end();
    return;
  }

  const handler = routes[url.pathname];

  if (req.method === 'GET' && handler) {
    const responseBody = handler();
    const body = JSON.stringify(responseBody);
    res.writeHead(200, buildHeaders('application/json', body.length));
    res.end(body);
    return;
  }

  res.writeHead(404, buildHeaders());
  res.end(JSON.stringify({ error: 'Not Found' }));
});

function buildHeaders(contentType = 'application/json', contentLength) {
  const headers = {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (typeof contentLength === 'number') {
    headers['Content-Length'] = contentLength;
  }

  return headers;
}

server.listen(PORT, () => {
  console.log(`Mock API running on http://localhost:${PORT}`);
});
