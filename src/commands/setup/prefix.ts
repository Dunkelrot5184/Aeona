import { CommandOptions, Context } from '@thereallonewolf/amethystframework';

import GuildDB from '../../database/models/guild.js';
import { AeonaBot } from '../../extras/index.js';

export default {
  name: 'prefix',
  description: 'Change the prefix for your server.',
  commandType: ['application', 'message'],
  category: 'setup',
  args: [
    {
      name: 'prefix',
      description: 'The prefix to use.',
      required: true,
      type: 'String',
    },
  ],
  userGuildPermissions: ['MANAGE_CHANNELS'],
  async execute(client: AeonaBot, ctx: Context) {
    if (!ctx.guild || !ctx.user || !ctx.channel) return;
    const prefix = ctx.options.getString('prefix', true);

    const guild = await GuildDB.findOne({ Guild: ctx.guild.id });
    if (!guild)
      new GuildDB({
        Guild: ctx.guild.id,
        Prefix: prefix,
      }).save();
    else {
      guild.Prefix = prefix;
      guild.save();
    }

    client.extras.succNormal(
      {
        text: `Succesfully set the prefix to: ${`\`${prefix}\``}`,
        type: 'reply',
      },
      ctx,
    );
  },
} as CommandOptions;
