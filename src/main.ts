import Koa from 'koa';
import logger from 'koa-logger';
import cors from '@koa/cors';
import proxy from 'koa-proxies';

const app = new Koa();
const port = process.env.PORT || 8090;
const targetRegex =
  process.env.TARGET_REGEX || '\\.(hidrateapp\\.com|inshur\\.com)$';

app.use(logger());
app.use(cors());

app.use((ctx, next) => {
  const target = ctx.headers['target'] as string;

  if (!target) {
    ctx.status = 400;
    ctx.response.body = { error: 'missing target header' };
    return;
  }

  const url = new URL(target);

  const matcher = new RegExp(targetRegex, 'gmi');

  if (!url.host.match(matcher)) {
    ctx.status = 400;
    ctx.response.body = { error: 'invalid target', target };
    return;
  }

  return proxy('/', {
    target,
    changeOrigin: true,
    logs(context, target) {
      console.log(target, context.req.headers);
      console.log(target, context.request.headers);
    },
    events: {
      proxyRes: (proxyRes, req, res) => {
        console.log('--- PROXY RES ---');
        console.log('req', req.headers);
        console.log('res', res.getHeaders());
        console.log('proxyRes', proxyRes.headers);
      },
      proxyReq(client, request, response) {
        console.log('--- PROXY REQ ---');
        // client.removeHeader('referer');
        // client.removeHeader('origin');
        client.removeHeader('x-forwarded-for');
        client.removeHeader('x-forwarded-proto');
        client.removeHeader('x-forwarded-port');
        client.removeHeader('postman-token');

        console.log('client', client.getHeaders());
        console.log('path', client.path);

        console.log('request', request.headers);
        console.log('response', response.getHeaders());
      },
    },
  })(ctx, next);
});

app.listen(port);

console.log(`listening on port ${port}`);
console.log(`target regex ${targetRegex}`);
