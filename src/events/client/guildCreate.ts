import { AmethystEmbed } from '@thereallonewolf/amethystframework';
import { Guild } from 'discordeno/transformers';

import { AeonaBot } from '../../extras/index.js';

export default async (client: AeonaBot, guild: Guild) => {
  if (guild == undefined) return;

  if (
    Date.now() > client.extras.startTime + 5 * 60 * 1000 &&
    client.cache.guilds.memory.size > client.extras.lastguildcount
  ) {
    const embed = new AmethystEmbed()
      .setTitle('Added to a new server!')
      .addField('Total servers:', `${client.cache.guilds.memory.size}`, true)
      .addField('Server name', `${guild.name}`, true)
      .addField('Server ID', `${guild.id}`, true)
      .addField(
        'Server members',
        `${guild.approximateMemberCount ?? guild.memberCount ?? 1}`,
        true,
      )
      .addField('Server owner', `<@${guild.ownerId}> (${guild.ownerId})`, true);

    client.extras.webhook({
      embeds: [embed],
    });
    if (guild.publicUpdatesChannelId) {
      const channel = guild.channels.get(guild.publicUpdatesChannelId);
      if (channel) {
        client.helpers.followAnnouncementChannel(
          '1057248837238009946',
          `${channel.id}`,
        );
      }
    }
    client.extras.lastguildcount = client.cache.guilds.memory.size;
  }
};
