import {
	CategoryOptions,
	createProxyCache,
	enableAmethystPlugin,
	AmethystError,
	ErrorEnums,
} from '@thereallonewolf/amethystframework';
import { BigString, createBot, createRestManager } from 'discordeno';
import dotenv from 'dotenv';
import { connect } from './database/connect.js';
dotenv.config();

import fs from 'fs';
import { INTENTS, REST_URL } from '../configs.js';
import { start } from '../gateway/index.js';
import botConfig from './botconfig/bot.js';
const DISCORD_TOKEN = process.env.DISCORD_TOKEN as string;
const REST_AUTHORIZATION = process.env.REST_AUTHORIZATION as string;

const basebot = createBot({
	token: DISCORD_TOKEN,
	intents: INTENTS,
});

const cachebot = createProxyCache(basebot, {
	fetchIfMissing: {
		channels: true,
		guilds: true,
		members: true,
		messages: true,
		roles: true,
		users: false,
	},
	cacheInMemory: {
		default: true,
		roles: false,
	},
});
export const bot = enableAmethystPlugin(cachebot, {
	owners: ['794921502230577182'],
	prefix: (bot, message) => {
		if (message.mentionedUserIds.includes(bot.applicationId)) {
			return [process.env.PREFIX, 'aeona', '<@!' + bot.applicationId + '>', ''];
		}
		return [process.env.PREFIX, 'aeona', '<@!' + bot.applicationId + '>'];
	},
	botMentionAsPrefix: true,
	ignoreBots: true,
	commandDir: './dist/bot/commands',
});



connect();
// bot settings
bot.extras.config = botConfig;
bot.extras.colors = botConfig.colors;
bot.extras.emotes = botConfig.emotes;

const parts = process.env.WEBHOOKURL!.split('/');
const token = parts.pop() || '';
const id = parts.pop();

bot.extras.webhook = async (content: any) => {
	return await bot.helpers.sendWebhookMessage(id as BigString, token, content);
};

bot.extras.startTime = new Date().getTime();

process.on('unhandledRejection', (error: Error) => {
	if (error.message.includes('Authorization token')) return;
	console.error(error);
});

process.on('warning', (warn) => {
	console.warn(warn);
});

fs.readdirSync('./dist/bot/handlers/').forEach((dir) => {
	fs.readdirSync(`./dist/bot/handlers/${dir}`).forEach(async (handler) => {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const a = await import(`./handlers/${dir}/${handler}`);

		a.default(bot);
	});
});

fs.readdirSync('./dist/bot/events/').forEach(async (dirs) => {
	const events = fs.readdirSync(`./dist/bot/events/${dirs}`).filter((files) => files.endsWith('.js'));

	for (const file of events) {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const a = await import(`./events/${dirs}/${file}`);

		bot.on(file.split('.')[0]!, a.default);
	}
});

const categories: CategoryOptions[] = [
	{
		name: 'afk',
		description: 'Set/List your afk.',
		uniqueCommands: false,
		default: 'set',
	},
	{
		name: 'announcement',
		description: 'Create/Edit your announcement.',
		uniqueCommands: false,
		default: 'create',
	},
	{
		name: 'automod',
		description: 'Configure the automod.',
		uniqueCommands: false,
		default: 'display',
	},
	{
		name: 'autosetup',
		description: 'Automatically setup certain commands.',
		uniqueCommands: false,
		default: 'log',
	},
	{
		name: 'birthdays',
		description: 'List your birthdays.',
		uniqueCommands: false,
		default: 'list',
	},
	{
		name: 'config',
		description: 'Configure the config system',
		uniqueCommands: true,
		default: 'list',
	},
	{
		name: 'fun',
		description: 'Have some fun.',
		uniqueCommands: true,
		default: 'list',
	},
	{
		name: 'game',
		description: 'Play some games.',
		uniqueCommands: true,
		default: 'list',
	},
	{
		name: 'info',
		description: 'See various informations',
		uniqueCommands: true,
		default: 'list',
	},
	{
		name: 'invites',
		description: 'Configure the invites system',
		uniqueCommands: false,
		default: 'show',
	},
	{
		name: 'levels',
		description: 'Configure the rank system',
		uniqueCommands: false,
		default: 'rannk',
	},
	{
		name: 'marriage',
		description: 'Create your family',
		uniqueCommands: true,
		default: 'family',
	},
	{
		name: 'messages',
		description: 'Configure the messages system',
		uniqueCommands: false,
		default: 'show',
	},
	{
		name: 'moderation',
		description: 'Clean your server',
		uniqueCommands: true,
		default: 'family',
	},
	{
		name: 'reactionroles',
		description: 'Setup reaction roles for your server',
		uniqueCommands: false,
		default: 'list',
	},
	{
		name: 'serverstats',
		description: 'Configure your server stats',
		uniqueCommands: true,
		default: 'list',
	},
	{
		name: 'setup',
		description: 'Configure your server',
		uniqueCommands: false,
		default: 'fun',
	},
	{
		name: 'stickymessages',
		description: 'Configure sticky messages',
		uniqueCommands: false,
		default: 'messages',
	},
	{
		name: 'suggestions',
		description: 'Create/Deny/Accept suggestions',
		uniqueCommands: true,
		default: 'list',
	},
	{
		name: 'thanks',
		description: 'Thank users for their help',
		uniqueCommands: true,
		default: 'list',
	},
	{
		name: 'tickets',
		description: 'Various ticket commands',
		uniqueCommands: true,
		default: 'list',
	},
	{
		name: 'tools',
		description: 'Various commands to help you',
		uniqueCommands: true,
		default: '',
	},
	{
		name: 'image',
		description: 'Enjoy image magic',
		uniqueCommands: true,
		default: '',
	},
];
for (let i = 0; i < categories.length; i++) {
	bot.amethystUtils.createCategory(categories[i]);
}

bot.rest = createRestManager({
	token: DISCORD_TOKEN,
	secretKey: REST_AUTHORIZATION,
	customUrl: REST_URL,
});

start();

bot.amethystUtils.createInhibitor('upvoteonly', async (b, command, options): Promise<true | AmethystError> => {
	if (command.extras.upvoteOnly) {
	

		try {
			if (process.env.TOPGG) {
				const response = await fetch(`https://top.gg/api/bots/${bot.user.id}/check?userId=${options.memberId}`);
				const json = await response.json();
				return true;
			}
		} catch (e) {
			console.log(e);
		}

		return {
			//@ts-ignore
			type: ErrorEnums.OTHER,
			value: "You need to upvote me at https://top.gg/bot/931226824753700934/vote to use this command.",
		  };
		
	}
	return true;
});

