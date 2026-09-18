import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

import {
  buildMessage,
  MemeCommandName,
  readCommands,
} from '../lib/commands.ts';
import { memeRule } from '../lib/rule.ts';

export default function aiwaysmeme(pi: ExtensionAPI): void {
  // Meme mode is per session and lives only as long as it does: turning it on
  // is a decision about this conversation, not a setting to persist.
  let memeMode = false;

  for (const { name, description, template } of readCommands()) {
    pi.registerCommand(name, {
      description,
      handler: async (args, context) => {
        if (name === MemeCommandName.On || name === MemeCommandName.Off) {
          memeMode = name === MemeCommandName.On;
        }

        const message = buildMessage(template, args);

        if (context.isIdle()) {
          pi.sendUserMessage(message);
          return;
        }

        pi.sendUserMessage(message, { deliverAs: 'followUp' });
        context.ui.notify(`${name} queued as a follow-up.`, 'info');
      },
    });
  }

  // The command that turned meme mode on is a user message, and its weight
  // fades as the conversation grows. This puts the rule in the system prompt of
  // every turn instead, where it does not compete with anything.
  pi.on('before_agent_start', async (event) =>
    memeMode
      ? { systemPrompt: `${event.systemPrompt}\n\n${memeRule()}` }
      : undefined,
  );
}
