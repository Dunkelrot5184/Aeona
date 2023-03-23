import { CommandOptions, Context } from '@thereallonewolf/amethystframework';

import { AeonaBot } from '../../extras/index.js';
import wrapper from '../../lib/popcat.js';

export default {
  name: 'npm',
  description: 'Search npm for a package',
  commandType: ['application', 'message'],
  category: 'tools',
  args: [
    {
      name: 'package',
      description: 'The package to search for',
      required: true,
      type: 'String',
    },
  ],
  async execute(client: AeonaBot, ctx: Context) {
    if (!ctx.guild || !ctx.user || !ctx.channel) return;
    const name = await ctx.options.getLongString('package', true);
    const r = await wrapper.npm(name).catch(() => {
      return client.extras.errNormal(
        {
          error: 'Package not found!',
          type: 'reply',
        },
        ctx,
      );
    });

    client.extras.embed(
      {
        title: `${r.name}`,
        fields: [
          {
            name: '<:name:1062774821190111272>  Name',
            value: `${r.name}`,
            inline: true,
          },
          {
            name: 'Version',
            value: `${r.version}`,
            inline: true,
          },
          {
            name: 'Description',
            value: `${r.description}`,
            inline: true,
          },
          {
            name: 'Keywords',
            value: `${r.keywords}`,
            inline: true,
          },
          {
            name: 'Author',
            value: `${r.author}`,
            inline: true,
          },
          {
            name: 'Downloads',
            value: `${r.downloads_this_year}`,
            inline: true,
          },
          {
            name: 'Last publish',
            value: `<t:${Math.round(
              new Date(r.last_published).getTime() / 1000,
            )}>`,
            inline: true,
          },
        ],
        type: 'reply',
      },
      ctx,
    );
  },
} as CommandOptions;
