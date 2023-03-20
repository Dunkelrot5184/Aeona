// eslint-disable-next-line prettier/prettier
import {
  Collection,
  createGatewayManager,
  delay,
  DiscordGatewayPayload,
  GatewayManager,
  Intents,
  routes,
} from "discordeno";
import { nanoid } from "nanoid";
import { Client, Connection, Server } from "net-ipc";
import os from "node:os";
import { Worker } from "worker_threads";

import config from "./config.js";

process.on("unhandledRejection", (error: Error) => {
  console.error(error);
});

process.on("warning", (warn) => {
  console.warn(warn);
});
/* eslint-disable no-console */
type EventClientConnection = {
  id: string;
  conn: Connection;
  isMaster: boolean;
  version: string;
};

const {
  DISCORD_TOKEN,
  REST_AUTHORIZATION,
  REST_SOCKET_PATH,
  EVENT_SOCKET_PATH,
} = config([
  "DISCORD_TOKEN",
  "REST_AUTHORIZATION",
  "REST_SOCKET_PATH",
  "EVENT_SOCKET_PATH",
]);

const restClient = new Client({ path: REST_SOCKET_PATH, port: 20000 });
const eventsServer = new Server({ path: EVENT_SOCKET_PATH, port: 20000 });

let retries = 0;
let readyShards = 0;
let gatewayOn = false;
let shardingEnded = false;

let currentVersion: string;
let swappingVersions = false;
let waitingForSwap: EventClientConnection[] = [];

const eventClientConnections: EventClientConnection[] = [];

let gatewayManager: GatewayManager;
const workers = new Collection<number, Worker>();
const nonces = new Map<string, (data: unknown) => void>();

const panic = (err: Error) => {
  console.error(err);
  process.exit(1);
};

restClient.on("close", () => {
  console.log("[GATEWAY] REST Client closed");

  const reconnectLogic = () => {
    console.log("[GATEWAY] Trying to reconnect to REST server");
    restClient.connect().catch(() => {
      setTimeout(reconnectLogic, 1000);

      console.log(`[GATEWAY] Fail when reconnecting... ${retries} retries`);

      if (retries >= 5) {
        console.log(`[GATEWAY] Couldn't reconnect to REST server.`);
        process.exit(1);
      }

      retries += 1;
    });
  };

  setTimeout(reconnectLogic, 2000);
});

eventsServer.on("message", async (msg, conn) => {
  if (msg.type === "IDENTIFY") {
    if (!currentVersion) currentVersion = msg.version;

    if (currentVersion === msg.version) {
      console.log(
        `[GATEWAY] Client connected. Version: ${msg.version} ID: ${conn.id}`
      );
      eventClientConnections.push({
        id: conn.id,
        conn,
        version: msg.version,
        isMaster: false,
      });

      if (eventClientConnections.length === 1) {
        console.log(
          `[GATEWAY] Client made master. Version: ${msg.version} ID: ${conn.id}`
        );
        conn.request({ type: "YOU_ARE_THE_MASTER" });
        eventClientConnections[0].isMaster = true;

        eventsToSend.forEach((event) => {
          conn.send(event);
        });
      }

      return;
    }

    if (swappingVersions) {
      waitingForSwap.push({
        id: conn.id,
        conn,
        version: msg.version,
        isMaster: false,
      });
      return;
    }

    swappingVersions = true;

    await Promise.all(
      eventClientConnections.map((a) =>
        a.conn.request({ type: "REQUEST_TO_SHUTDOWN" })
      )
    ).catch();

    await delay(1000);

    swappingVersions = false;
    currentVersion = msg.version;

    eventClientConnections.push({
      id: conn.id,
      conn,
      version: msg.version,
      isMaster: true,
    });

    await conn.request({ type: "YOU_ARE_THE_MASTER" }).catch(() => null);

    console.log(
      `[GATEWAY] Client made master. Version: ${msg.version} ID: ${conn.id}`
    );
    waitingForSwap.forEach((c) => eventClientConnections.push(c));

    waitingForSwap = [];
  }
});

eventsServer.on("request", async (req, res) => {
  if (req.type === "GUILD_COUNT") {
    if (!shardingEnded) return res(null);

    const infos = await Promise.all(
      workers.map(async (worker) => {
        const nonce = nanoid();

        return new Promise((resolve) => {
          worker.postMessage({ type: "GET_GUILD_COUNT", nonce });

          nonces.set(nonce, resolve);
        });
      })
    ).then((guilds) =>
      guilds.reduce(
        (acc, cur) =>
          // @ts-expect-error it will work
          acc + cur.guilds,
        0
      )
    );

    return res({ guilds: infos, shards: gatewayManager.manager.totalShards });
  }

  if (req.type === "SHARDS_INFO") {
    if (!shardingEnded) return res(null);

    const infos = await Promise.all(
      workers.map(async (worker) => {
        const nonce = nanoid();

        return new Promise((resolve) => {
          worker.postMessage({ type: "GET_SHARDS_INFO", nonce });

          nonces.set(nonce, resolve);
        });
      })
    ).then((results) =>
      results.reduce((acc, cur) => {
        // @ts-expect-error uai
        acc.push(...cur);
        return acc;
      }, [])
    );

    return res(infos);
  }
});

eventsServer.on("disconnect", (conn) => {
  const eventClient = eventClientConnections.find((a) => a.id === conn.id);

  eventClientConnections.splice(
    eventClientConnections.findIndex((c) => c.id === conn.id),
    1
  );

  if (swappingVersions) return;

  if (eventClientConnections.length === 0) return;

  if (eventClient?.isMaster) {
    eventClientConnections[0].conn.request({ type: "YOU_ARE_THE_MASTER" });
    eventClientConnections[0].isMaster = true;
  }
});

eventsServer.on("ready", () => {
  console.log("[GATEWAY] Event Handler Server started");
  retries = 0;
});

restClient.connect().catch(panic);
eventsServer.start().catch(panic);
const eventsToSend: any[] = [];
const createWorker = (workerId: number) => {
  const workerData = {
    intents:
      Intents.DirectMessageReactions |
      Intents.DirectMessageTyping |
      Intents.DirectMessages |
      Intents.Guilds |
      Intents.MessageContent |
      Intents.GuildMembers |
      Intents.GuildBans |
      Intents.GuildEmojis |
      Intents.GuildIntegrations |
      Intents.GuildWebhooks |
      Intents.GuildInvites |
      Intents.GuildVoiceStates |
      Intents.GuildMessages |
      Intents.GuildMessageReactions |
      Intents.DirectMessageTyping |
      Intents.GuildScheduledEvents,
    token: DISCORD_TOKEN,
    totalShards: gatewayManager.manager.totalShards,
    workerId,
  };

  const worker = new Worker("./dist/worker.js", {
    env: process.env,
    workerData,
  });

  worker.on("message", async (data) => {
    switch (data.type) {
      case "REQUEST_IDENTIFY": {
        await gatewayManager.manager.requestIdentify(data.shardId);

        const allowIdentify = {
          type: "ALLOW_IDENTIFY",
          shardId: data.shardId,
        };

        worker.postMessage(allowIdentify);
        break;
      }
      case "BROADCAST_EVENT": {
        const { shardId } = data.data as {
          shardId: number;
          data: DiscordGatewayPayload;
        };

        if (eventClientConnections.length === 0) {
          //TODO: Filter Events
          if (data.data.t == "GUILD_CREATE") eventsToSend.push(data.data);
          return;
        }

        const clientIndex = shardId % eventClientConnections.length;
        const toSendClient = eventClientConnections[clientIndex];

        toSendClient.conn.send(data.data);
        break;
      }
      case "NONCE_REPLY":
        nonces.get(data.nonce)?.(data.data);
        break;
      case "SHARD_READY":
        readyShards += 1;
        if (readyShards === gatewayManager.manager.totalShards) {
          shardingEnded = true;
          console.log("[SHARDING] - All shards ready!");
        }
        break;
    }
  });

  return worker;
};

async function startGateway() {
  const results = await restClient
    .request({
      type: "RUN_METHOD",
      data: {
        Authorization: REST_AUTHORIZATION,
        body: undefined,
        method: "GET",
        url: routes.GATEWAY_BOT(),
      },
    })
    .then((res) => ({
      url: res.url,
      shards: res.shards,
      sessionStartLimit: {
        total: res.session_start_limit.total,
        remaining: res.session_start_limit.remaining,
        resetAfter: res.session_start_limit.reset_after,
        maxConcurrency: res.session_start_limit.max_concurrency,
      },
    }));

  const workersAmount = os.cpus().length;
  const totalShards = results.shards;

  console.log(
    `[GATEWAY] - Starting sessions. ${totalShards} shards in ${workersAmount} workers with ${results.sessionStartLimit.maxConcurrency} concurrency`
  );

  gatewayManager = createGatewayManager({
    gatewayBot: results,
    gatewayConfig: {
      token: DISCORD_TOKEN,
      intents:
        Intents.DirectMessageReactions |
        Intents.DirectMessageTyping |
        Intents.DirectMessages |
        Intents.Guilds |
        Intents.MessageContent |
        Intents.GuildMembers |
        Intents.GuildBans |
        Intents.GuildEmojis |
        Intents.GuildIntegrations |
        Intents.GuildWebhooks |
        Intents.GuildInvites |
        Intents.GuildVoiceStates |
        Intents.GuildMessages |
        Intents.GuildMessageReactions |
        Intents.DirectMessageTyping |
        Intents.GuildScheduledEvents,
    },
    totalShards,
    shardsPerWorker: Math.ceil(totalShards / workersAmount),
    totalWorkers: workersAmount,
    handleDiscordPayload: () => null,
    tellWorkerToIdentify: async (_, workerId, shardId) => {
      let worker = workers.get(workerId);

      if (!worker) {
        console.log(`[GATEWAY] - Spawning worker ${workerId}`);
        worker = createWorker(workerId);
        workers.set(workerId, worker);
      }

      const identify = {
        type: "IDENTIFY_SHARD",
        shardId,
      };

      worker.postMessage(identify);
    },
  });

  gatewayManager.spawnShards();
}

restClient.on("ready", async () => {
  console.log("[GATEWAY] REST IPC connected");
  restClient.send({ type: "IDENTIFY", package: "GATEWAY", id: "0" });

  if (gatewayOn) return;

  gatewayOn = true;

  startGateway();
});
