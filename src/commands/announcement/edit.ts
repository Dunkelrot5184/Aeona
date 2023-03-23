import { CommandOptions, Context } from '@thereallonewolf/amethystframework';

import { AeonaBot } from '../../extras/index.js';

export default {
  name: 'edit',
  description: 'Edit an announcement',
  commandType: ['application', 'message'],
  category: 'announcement',
  args: [
    {
      name: 'message',
      description: 'Announcement Text. Example: New Update.',
      type: 'String',
      required: true,
    },
    {
      name: 'id',
      description:
        'Id of the message. Note the command should be run in the same channel as the message.',
      type: 'String',
      required: true,
    },
  ],
  userGuildPermissions: ['MANAGE_GUILD'],
  async execute(client: AeonaBot, ctx: Context) {
    if (!ctx.guild || !ctx.user || !ctx.channel) return;
    const message = ctx.options.getString('message', true);
    const messageId = ctx.options.getString('id', true);
    if (!message || !messageId) return;

    const editMessage = await client.helpers.getMessage(`${ctx.channel.id}`, messageId);

    client.extras.editEmbed(
      {
        title: `📢 Announcement!`,
        desc: message,
      },
      editMessage,
    );

    client.extras.succNormal(
      {
        text: `Announcement has been edit successfully!`,
      },
      ctx,
    );
  },
} as CommandOptions;
