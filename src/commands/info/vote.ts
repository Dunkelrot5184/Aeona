import { CommandOptions, Components, Context } from '@thereallonewolf/amethystframework';
import Topgg from '@top-gg/sdk';

import { AeonaBot } from '../../extras/index.js';

export default {
  name: 'vote',
  description: 'Generate a chat message',
  commandType: ['application', 'message'],
  category: 'info',
  args: [],
  async execute(client: AeonaBot, ctx: Context) {
    if (!ctx.guild || !ctx.user || !ctx.channel) return;
    const dbl = new Topgg.Api(process.env.TOPGG_TOKEN!);

    const row = new Components().addButton(
      'Vote for me',
      'Link',
      `https://top.gg/bot/${client.user.id}/vote`,
    );

    dbl
      .hasVoted(`${ctx.user.id}`)
      .then((voted) => {
        if (voted) {
          client.extras.embed(
            {
              title: `Vote`,
              desc: `You have already voted!`,
              color: client.extras.config.colors.succes,
              components: row,
              type: 'reply',
            },
            ctx,
          );
        }
        if (!voted) {
          client.extras.embed(
            {
              title: `Vote`,
              desc: `You have not voted!`,
              image: `https://cdn.discordapp.com/attachments/843487478881976381/874694192755007509/banner_vote.jpg`,
              color: client.extras.config.colors.error,
              components: row,
              type: 'reply',
            },
            ctx,
          );
        }
      })
      .catch((_error) => {
        client.extras.errNormal(
          {
            error: `There was an error by checking this vote!`,
          },
          ctx,
        );
      });
  },
} as CommandOptions;
