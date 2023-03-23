import { CommandOptions, Context } from '@thereallonewolf/amethystframework';

import Schema from '../../database/models/inviteRewards.js';
import { AeonaBot } from '../../extras/index.js';

export default {
  name: 'createreward',
  description:
    'Create a reward for a user reaching a certain amount of invites.',
  commandType: ['application', 'message'],
  category: 'invites',
  args: [
    {
      name: 'amount',
      description: 'How many invites',
      required: true,
      type: 'Number',
    },
    {
      name: 'role',
      description: 'The role',
      required: true,
      type: 'Role',
    },
  ],
  userGuildPermissions: ['MANAGE_MESSAGES'],
  async execute(client: AeonaBot, ctx: Context) {
    if (!ctx.guild || !ctx.user || !ctx.channel) return;
    const messages = ctx.options.getNumber('amount', true);
    const role = await ctx.options.getRole('role', true);

    Schema.findOne(
      { Guild: ctx.guild!.id, Messages: messages },
      async (err: any, data: any) => {
        if (data) {
          return client.extras.errNormal(
            {
              error: 'This invite amount already has a reward!',
              type: 'reply',
            },
            ctx,
          );
        }
        new Schema({
          Guild: ctx.guild!.id,
          Messages: messages,
          Role: `${role.id}`,
        }).save();

        client.extras.succNormal(
          {
            text: `Invite reward created`,
            fields: [
              {
                name: '<:role:1062978537436491776> Role',
                value: `<@&${role.id}>`,
                inline: true,
              },
              {
                name: '📈 Invites Amount',
                value: `${messages}`,
                inline: true,
              },
            ],
            type: 'reply',
          },
          ctx,
        );
      },
    );
  },
} as CommandOptions;
