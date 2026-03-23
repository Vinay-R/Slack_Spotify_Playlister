import { WebClient } from "@slack/web-api";

export function getSlackClient(token: string): WebClient {
  return new WebClient(token);
}

export interface SlackChannel {
  id: string;
  name: string;
  memberCount: number;
  topic: string;
  purpose: string;
}

export async function listChannels(token: string): Promise<SlackChannel[]> {
  const client = getSlackClient(token);
  const channels: SlackChannel[] = [];
  let cursor: string | undefined;

  do {
    const result = await client.conversations.list({
      types: "public_channel",
      exclude_archived: true,
      limit: 200,
      cursor,
    });

    for (const ch of result.channels || []) {
      channels.push({
        id: ch.id!,
        name: ch.name!,
        memberCount: ch.num_members || 0,
        topic: ch.topic?.value || "",
        purpose: ch.purpose?.value || "",
      });
    }

    cursor = result.response_metadata?.next_cursor || undefined;
  } while (cursor);

  return channels.sort((a, b) => a.name.localeCompare(b.name));
}

export interface SlackMessage {
  ts: string;
  text: string;
}

export async function fetchChannelHistory(
  token: string,
  channelId: string,
  oldest?: string
): Promise<SlackMessage[]> {
  const client = getSlackClient(token);
  const messages: SlackMessage[] = [];
  let cursor: string | undefined;

  do {
    const result = await client.conversations.history({
      channel: channelId,
      limit: 200,
      cursor,
      oldest,
    });

    for (const msg of result.messages || []) {
      if (msg.text) {
        messages.push({ ts: msg.ts!, text: msg.text });
      }
    }

    cursor = result.response_metadata?.next_cursor || undefined;
  } while (cursor);

  return messages;
}
