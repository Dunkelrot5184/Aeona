import { CommandOptions, Context } from '@thereallonewolf/amethystframework';

import { AeonaBot } from '../../extras/index.js';

export default {
  name: 'unban',
  description: 'Unban a user',
  commandType: ['application', 'message'],
  category: 'moderation',
  args: [
    {
      name: 'userid',
      description: 'The ID of the user you want to unban',
      required: true,
      type: 'String',
    },
  ],
  userGuildPermissions: ['MANAGE_GUILD'],
  async execute(client: AeonaBot, ctx: Context) {
    if (!ctx.guild || !ctx.user || !ctx.channel) return;

    client.helpers
      .unbanMember(`${ctx.guild!.id}`, ctx.options.getString('userid', true))
      .then(function () {
        client.extras.succNormal(
          {
            text: 'The specified user has been successfully unbanned!',
            type: 'reply',
          },
          ctx,
        );
      })
      .catch(function () {
        return client.extras.errNormal(
          {
            error: `I could not find the user!`,
            type: 'reply',
          },
          ctx,
        );
      });
  },
} as CommandOptions;
