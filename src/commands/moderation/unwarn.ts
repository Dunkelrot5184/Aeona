import { CommandOptions, Context } from '@thereallonewolf/amethystframework';

import Schema from '../../database/models/warnings.js';
import { AeonaBot } from '../../extras/index.js';

export default {
  name: 'unwarn',
  description: 'Remove warning from a user.',
  commandType: ['application', 'message'],
  category: 'moderation',
  args: [
    {
      name: 'user',
      description: 'The user.',
      required: true,
      type: 'User',
    },
  ],
  userGuildPermissions: ['MODERATE_MEMBERS'],
  async execute(client: AeonaBot, ctx: Context) {
    if (!ctx.guild || !ctx.user || !ctx.channel) return;

    const member = await ctx.options.getUser('user', true);

    Schema.findOne(
      { Guild: ctx.guild!.id, User: member.id },
      async (err: any, data: { Warns: number; save: () => void }) => {
        if (data) {
          data.Warns -= 1;
          data.save();
        } else {
          client.extras.errNormal(
            {
              error: 'User has no warnings!',
              type: 'reply',
            },
            ctx,
          );
        }
      },
    );
    const channel = await client.helpers.getDmChannel(member.id);
    client.extras
      .embed(
        {
          title: `🔨 Unwarn`,
          desc: `You've been unwarned in **${ctx.guild.name}**`,
          fields: [
            {
              name: '<:members:1063116392762712116> Moderator',
              value: `${ctx.user.username}#${ctx.user.discriminator}`,
              inline: true,
            },
          ],
        },
        channel,
      )
      .catch();

    client.emit('warnRemove', member, ctx.user);
    client.extras.succNormal(
      {
        text: `The user's warning has been successfully removed`,
        fields: [
          {
            name: '<:members:1063116392762712116> User',
            value: `<@${member.id}>`,
            inline: true,
          },
        ],
        type: 'reply',
      },
      ctx,
    );
  },
} as CommandOptions;
