import { CommandOptions, Context } from '@thereallonewolf/amethystframework';

import { AeonaBot } from '../../extras/index.js';

export default {
  name: 'stankrate',
  description: 'See your stank rate',
  commandType: ['application', 'message'],
  category: 'fun',
  args: [
    {
      name: 'user',
      description: 'The user',
      required: false,
      type: 'User',
    },
  ],
  async execute(client: AeonaBot, ctx: Context) {
    if (!ctx.guild || !ctx.user || !ctx.channel) return;
    const result = Math.ceil(Math.random() * 100);

    client.extras.embed(
      {
        title: `Stank rate`,
        desc: `You are ${result}% stanky!`,
        type: 'reply',
      },
      ctx,
    );
  },
} as CommandOptions;
