import { CommandOptions, Context } from '@thereallonewolf/amethystframework';
import hmfull from 'hmfull';

import { AeonaBot } from '../../extras/index.js';

export default {
  name: 'blush',
  description: 'E-to...',
  commandType: ['application', 'message'],
  category: 'anime',
  args: [],
  async execute(client: AeonaBot, ctx: Context) {
    if (!ctx.guild || !ctx.user || !ctx.channel) return;

    client.extras.embed(
      {
        title: `${ctx.user.username} blushes`,
        image: (await hmfull.HMtai.sfw.blush()).url,
        type: 'reply',
      },
      ctx,
    );
  },
} as CommandOptions;
