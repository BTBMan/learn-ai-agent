import { Hono } from 'hono';
import { AppEnv } from './types';
import { DurableObject } from 'cloudflare:workers';

const app = new Hono<AppEnv>();

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class Room extends DurableObject<AppEnv['Bindings']> {
  // 升级协议并创建 webSocket 连接
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected websocket', { status: 426 });
    }

    const url = new URL(request.url);
    const username = url.searchParams.get('user') ?? 'anon';

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.serializeAttachment({ username }); // 把序列化的数据传递给 client

    // Hibernatable 接收服务端 socket
    this.ctx.acceptWebSocket(server);

    // 返回给客户端 client socket
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== 'string') {
      return;
    }

    // const userMessage: ChatMessage = { role: 'user', content: message };

    // const history =
    //   (await this.ctx.storage.get<ChatMessage[]>('history')) ?? [];
    // history.push(userMessage);

    // const result = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct-fp8', {
    //   messages: history,
    // });

    // const assistantMessage: ChatMessage = {
    //   role: 'assistant',
    //   content: result.response!,
    // };
    // history.push(assistantMessage);

    // await this.ctx.storage.put('history', history);

    // ws.send(JSON.stringify(assistantMessage));

    const { username } = ws.deserializeAttachment();

    for (const client of this.ctx.getWebSockets()) {
      if (client === ws) {
        continue;
      }
      try {
        ws.send(`回答 [${username}]: "${message}" 的问题`);
      } catch {
        // 客户端掉线时可能报错，忽略即可
      }
    }

    await this.ctx.storage.setAlarm(Date.now() + 10 * 1000);
  }

  async webSocketClose(ws: WebSocket, code: number) {
    ws.close(code);

    console.log(`WebSocket closed with code ${code}`);
  }

  alarm(alarmInfo?: AlarmInvocationInfo): void | Promise<void> {
    console.log(alarmInfo);
  }
}

app.get('/room/:userId', async (c) => {
  const userId = await c.req.param('userId');
  const id = c.env.ROOM.idFromName(userId);
  const stub = c.env.ROOM.get(id);

  return stub.fetch(c.req.raw);
});

export default app;
