import { CommandOptions, Context } from '@thereallonewolf/amethystframework';

import ticketSchema from '../../database/models/tickets.js';
import { AeonaBot } from '../../extras/index.js';

export default {
  name: 'adduser',
  description: 'Add user to the ticket',
  commandType: ['application', 'message'],
  category: 'tickets',
  args: [
    {
      name: 'user',
      description: 'User to add to the ticket',
      required: true,
      type: 'User',
    },
  ],
  userGuildPermissions: ['MANAGE_MESSAGES'],
  async execute(client: AeonaBot, ctx: Context) {
    if (!ctx.guild || !ctx.user || !ctx.channel) return;
    const data = await ticketSchema.findOne({ Guild: ctx.guild!.id });

    if (data) {
      const ticketCategory = await client.cache.channels.get(
        BigInt(data.Category!),
      );
      if (ticketCategory == undefined) {
        return client.extras.errNormal(
          {
            error: 'Do the ticket setup!',
            type: 'reply',
          },
          ctx,
        );
      }

      if (ctx.channel.parentId == ticketCategory.id) {
        const user = await ctx.options.getUser('user', true);
        client.helpers.editChannel(ctx.channel.parentId, {
          permissionOverwrites: [
            {
              type: 1,
              id: user.id,
              allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
            },
          ],
        });

        return client.extras.simpleEmbed(
          {
            desc: `Added <@${user.id}>`,
            type: 'reply',
          },
          ctx,
        );
      }
      client.extras.errNormal(
        {
          error: 'This is not a ticket!',
          type: 'reply',
        },
        ctx,
      );
    }
  },
} as CommandOptions;
