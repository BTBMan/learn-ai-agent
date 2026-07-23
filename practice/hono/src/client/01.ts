import { hc } from 'hono/client';
import { RPCType } from '..';

const client = hc<RPCType>('http://localhost:8787');

client.rpc['?:id'].$get({
  param: {
    id: '1',
  },
  query: {
    keywords: '1',
  },
});

client.rpc.$post({
  json: {
    name: '1',
    email: '1',
  },
});
