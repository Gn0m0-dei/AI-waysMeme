import { join } from 'node:path';

import type { Plugin } from '@opencode-ai/plugin';

import { MemeCommandName, readCommands } from '../lib/commands.ts';
import { configureOpencode } from '../lib/opencode.ts';
import { packageRoot } from '../lib/package-root.ts';
import { memeRule } from '../lib/rule.ts';

// OpenCode's legacy plugin loader treats every function exported from a plugin
// module as a plugin, so this file exports exactly one. Everything else lives
// in lib/.

export const AiWaysMemePlugin: Plugin = async () => {
  const setup = {
    commands: readCommands(),
    skillsDirectory: join(packageRoot, 'skills'),
  };

  // Meme mode is per session and lives only as long as the process: turning it
  // on is a decision about that conversation, not a setting to persist.
  const memeSessions = new Set<string>();

  return {
    config: async (config) => {
      configureOpencode(config, setup);
    },

    'command.execute.before': async ({ command, sessionID }) => {
      if (command === MemeCommandName.On) {
        memeSessions.add(sessionID);
      }
      if (command === MemeCommandName.Off) {
        memeSessions.delete(sessionID);
      }
    },

    // The command that turned meme mode on is a user message, and its weight
    // fades as the conversation grows. This puts the rule in the system prompt
    // of every turn instead, where it does not compete with anything.
    'experimental.chat.system.transform': async ({ sessionID }, output) => {
      if (sessionID && memeSessions.has(sessionID)) {
        output.system.push(memeRule());
      }
    },
  };
};
