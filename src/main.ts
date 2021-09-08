import Koa from 'koa';
import cors from '@koa/cors';
import proxy from 'koa-proxies';

const app = new Koa();
const port = process.env.PORT || 8090;
const targetRegex = process.env.TARGET_REGEX || '/\\.inshur\\.com$';

app.use(cors());

app.use((ctx, next) => {
  const target = ctx.headers['target'] as string;

  console.log(target);

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
    logs: true,
  })(ctx, next);
});

app.listen(port);

console.log(`listening on port ${port}`);
