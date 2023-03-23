import { CommandOptions, Context } from '@thereallonewolf/amethystframework';

import { AeonaBot } from '../../extras/index.js';

export default {
  name: 'youtube',
  description: 'Search youtube for videos',
  commandType: ['application', 'message'],
  category: 'tools',
  args: [
    {
      name: 'text',
      description: 'the sentence to search for',
      required: true,
      type: 'String',
    },
  ],
  async execute(client: AeonaBot, ctx: Context) {
    if (!ctx.guild || !ctx.user || !ctx.channel) return;
    const name = encodeURIComponent(ctx.options.getLongString('text', true));
    const link = `https://www.youtube.com/results?search_query=${name}`;

    client.extras.succNormal(
      {
        text: `I have found the following for: \`${name}\``,
        fields: [
          {
            name: `Link`,
            value: `[Click here to see the link](${link})`,
            inline: true,
          },
        ],
        type: 'reply',
      },
      ctx,
    );
  },
} as CommandOptions;
