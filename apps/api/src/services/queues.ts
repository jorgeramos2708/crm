import { Queue, Worker, JobsOptions, Job } from "bullmq";
import { env } from "../config.js";

const QUEUE_ACTION = "automatizaciones-action";
const QUEUE_CAMPAIGN = "email-campaign-send";
const QUEUE_TASK_DUE = "tarea-vencimiento";

function redisOptions() {
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    password: url.password || undefined,
    username: url.username || undefined,
    maxRetriesPerRequest: null as null,
    enableReadyCheck: false,
    lazyConnect: false,
  };
}

const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 5000 },
  removeOnComplete: { age: 7 * 24 * 3600, count: 1000 },
  removeOnFail: { age: 30 * 24 * 3600 },
};

let actionQueue: Queue | null = null;
let campaignQueue: Queue | null = null;
let taskQueue: Queue | null = null;

export function getActionQueue(): Queue {
  if (!actionQueue) {
    actionQueue = new Queue(QUEUE_ACTION, {
      connection: redisOptions(),
      defaultJobOptions,
    });
  }
  return actionQueue;
}

export function getCampaignQueue(): Queue {
  if (!campaignQueue) {
    campaignQueue = new Queue(QUEUE_CAMPAIGN, {
      connection: redisOptions(),
      defaultJobOptions,
    });
  }
  return campaignQueue;
}

export function getTaskQueue(): Queue {
  if (!taskQueue) {
    taskQueue = new Queue(QUEUE_TASK_DUE, {
      connection: redisOptions(),
      defaultJobOptions,
    });
  }
  return taskQueue;
}

export async function scheduleAction(
  action: Record<string, any>,
  context: Record<string, any>,
  delaySeconds: number,
): Promise<string> {
  const delay = Math.max(0, Math.round(delaySeconds * 1000));
  const job = await getActionQueue().add(
    "execute-action",
    { action, context },
    {
      delay,
      jobId: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    },
  );
  return job.id!;
}

export async function scheduleCampaignSend(
  campaignId: string,
  when: Date,
): Promise<string | null> {
  const ms = when.getTime() - Date.now();
  if (ms <= 0) return null;
  const job = await getCampaignQueue().add(
    "send-campaign",
    { campaignId },
    { delay: ms, jobId: `campaign-${campaignId}` },
  );
  return job.id!;
}

export async function scheduleTaskDueReminder(
  taskId: string,
  when: Date,
): Promise<string | null> {
  const ms = when.getTime() - Date.now();
  if (ms <= 0) return null;
  const job = await getTaskQueue().add(
    "task-due",
    { taskId },
    { delay: ms, jobId: `task-${taskId}` },
  );
  return job.id!;
}

export async function cancelJob(queue: Queue, jobId: string): Promise<void> {
  const job = await queue.getJob(jobId);
  if (job) await job.remove();
}

export async function closeQueues(): Promise<void> {
  await Promise.all(
    [actionQueue, campaignQueue, taskQueue]
      .filter(Boolean)
      .map((q) => q!.close()),
  );
  actionQueue = null;
  campaignQueue = null;
  taskQueue = null;
}

type Processor = (job: Job) => Promise<void>;

export function createWorker(queueName: string, processor: Processor): Worker {
  return new Worker(queueName, processor, {
    connection: redisOptions(),
    concurrency: 5,
    lockDuration: 60000,
  });
}

export const QUEUES = {
  ACTION: QUEUE_ACTION,
  CAMPAIGN: QUEUE_CAMPAIGN,
  TASK_DUE: QUEUE_TASK_DUE,
} as const;
