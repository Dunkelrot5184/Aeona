import { AmethystBot } from '@thereallonewolf/amethystframework';
import { Channel, Guild, Member, Role } from 'discordeno';
import Schema from '../../database/models/stats.js';

export default async (client: AmethystBot) => {
	client.extras.getTemplate = async (guild: bigint) => {
		try {
			const data = await Schema.findOne({ Guild: guild });

			if (data && data.ChannelTemplate) {
				return data.ChannelTemplate;
			} else {
				return `{emoji} {name}`;
			}
		} catch {
			return `{emoji} {name}`;
		}
	};

	client.on('guildMemberAdd', async (client: AmethystBot, member: Member) => {
		client.emit('updateMembers', client, await client.helpers.getGuild(member.guildId));
		client.emit('updateBots', client, await client.helpers.getGuild(member.guildId));
	});
	client.on('guildMemberRemove', async (client: AmethystBot, member: Member) => {
		client.emit('updateMembers', client, await client.helpers.getGuild(member.guildId));
		client.emit('updateBots', client, await client.helpers.getGuild(member.guildId));
	});

	client.on('channelCreate', async (client: AmethystBot, channel: Channel) => {
		if (!channel.guildId) return;
		client.emit('updateChannels', channel, client, await client.helpers.getGuild(channel.guildId));
		client.emit('updateNewsChannels', client, channel, await client.helpers.getGuild(channel.guildId));
		client.emit('updateStageChannels', client, channel, await client.helpers.getGuild(channel.guildId));
		client.emit('updateTextChannels', client, channel, await client.helpers.getGuild(channel.guildId));
		client.emit('updateVoiceChannels', client, channel, await client.helpers.getGuild(channel.guildId));
	});
	client.on('channelDelete', async (client: AmethystBot, channel: Channel) => {
		if (!channel.guildId) return;
		client.emit('updateChannels', client, channel, await client.helpers.getGuild(channel.guildId));
		client.emit('updateNewsChannels', client, channel, await client.helpers.getGuild(channel.guildId));
		client.emit('updateStageChannels', client, channel, await client.helpers.getGuild(channel.guildId));
		client.emit('updateTextChannels', client, channel, await client.helpers.getGuild(channel.guildId));
		client.emit('updateVoiceChannels', client, channel, await client.helpers.getGuild(channel.guildId));
	});

	client.on('roleCreate', async (client: AmethystBot, role: Role) =>
		client.emit('updateRoles', client, await client.helpers.getGuild(role.guildId)),
	);
	client.on('roleDelete', async (client: AmethystBot, role: Role) =>
		client.emit('updateRoles', client, await client.helpers.getGuild(role.guildId)),
	);

	client.on('guildMemberBoost', async (booster: Member) =>
		client.emit('updateBoosts', client, await client.helpers.getGuild(booster.guildId)),
	);
	client.on('guildMemberUnboost', async (booster: Member) =>
		client.emit('updateBoosts', client, await client.helpers.getGuild(booster.guildId)),
	);

	client.on('guildBoostLevelUp', async (tier: Guild) =>
		client.emit('updateTier', client, tier),
	);
	client.on('guildBoostLevelDown', async (tier: Guild) =>
		client.emit('updateTier', client,tier),
	);

	client.on('emojiCreate', async (emoji) => {
		client.emit('updateEmojis', client, emoji, await client.helpers.getGuild(emoji.guildId));
		client.emit('updateAEmojis', client, emoji, await client.helpers.getGuild(emoji.guildId));
		client.emit('updateSEmojis', client, emoji, await client.helpers.getGuild(emoji.guildId));
	});
	client.on('emojiDelete', async (emoji) => {
		client.emit('updateEmojis', client, emoji, await client.helpers.getGuild(emoji.guildId));
		client.emit('updateAEmojis', client, emoji, await client.helpers.getGuild(emoji.guildId));
		client.emit('updateSEmojis', client, emoji, await client.helpers.getGuild(emoji.guildId));
	});

	client.on('ready', async (client) => client.emit('updateClock', client));
};
