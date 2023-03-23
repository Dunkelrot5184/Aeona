import { CommandOptions, Context } from '@thereallonewolf/amethystframework';
import voucher_codes from 'voucher-code-generator';

import Premium from '../../database/models/premium.js';
import { AeonaBot } from '../../extras/index.js';

export default {
  name: 'createcode',
  description: 'Create premium codes',
  commandType: ['application', 'message'],
  category: 'owner',
  args: [
    {
      name: 'number',
      type: 'String',
      required: true,
    },
  ],
  ownerOnly: true,
  async execute(client: AeonaBot, ctx: Context) {
    if (!ctx.guild || !ctx.user || !ctx.channel) return;
    const code = ctx.options.getString('number', true);

    const expiresAt = Date.now() + 2592000000;
    const array: string[] = [];
    for (let i = 0; i < Number(code); i++) {
      const codePremium = voucher_codes.generate({
        pattern: '####-####-####',
      });

      const c = codePremium.toString().toUpperCase();

      const code = new Premium({
        code: c,
        expiresAt: expiresAt,
        plan: 'month',
      });
      code.save();
      array.push(`\`${i + 1}-\` ${c}`);
    }
    client.extras.succNormal(
      {
        text: array.join('\n'),
        type: 'reply',
      },
      ctx,
    );
  },
} as CommandOptions;
