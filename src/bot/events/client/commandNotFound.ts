import { Point } from '@influxdata/influxdb-client';
import { AmethystBot } from '@thereallonewolf/amethystframework';
import { Message } from 'discordeno/transformers';
import { Influx } from './commandStart.js';
import fetch from 'node-fetch';
import Schema from '../../database/models/votecredits.js';
export default async (bot: AmethystBot, message: Message, commandName: string) => {
	const url =
		'https://DumBotApi.aeona.repl.co?text=' +
		encodeURIComponent(message.content) +
		'&userId=' +
		message.authorId +
		'&key=' +
		process.env.apiKey;

	const options = {
		method: 'GET',
	};

	fetch(url, options)
		.then((res) => res.text())
		.then(async (json) => {
			Influx?.writePoint(
				new Point('commands').tag('action', 'addition').tag('command', 'chatbot').intField('value', 1),
			);
			const s = [
				'\n discord.gg/qURxRRHPwa',
				'\n Generate beautiful images using /imagine \n || https://media.discordapp.net/attachments/1034419695060791342/1044217539682652170/unknown.png ||',
			];
			const randomNumber = Math.floor(Math.random() * 30);
			json = randomNumber == 0 ? (json ?? '') + s[0] : randomNumber == 1 ? (json ?? '') + s[1] : json;
			await bot.helpers.sendMessage(message.channelId, {
				content: json,
				messageReference: {
					channelId: message.channelId,
					messageId: message.id + '',
					guildId: message.guildId,
					failIfNotExists: false,
				},
			});
			let user = await Schema.findOne({ User: message.member.id });
			if (!user) user = new Schema({ User: message.member.id });
			if (user.LastVersion != bot.extras.version)
				bot.helpers.sendMessage(message.channelId, {
					content: 'You have unread news. Use `+news` to read it',
				});
			Influx?.writePoint(new Point('commandruncount').tag('action', 'addition').intField('usage', 1));
		})

		.catch((err) => console.error('error:' + err));
};
