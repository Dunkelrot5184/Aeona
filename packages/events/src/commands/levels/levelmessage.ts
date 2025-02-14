import { CommandOptions, Components, Context } from '@thereallonewolf/amethystframework';

import Schema from '../../database/models/levelChannels.js';
import { AeonaBot } from '../../extras/index.js';
import { ChannelTypes } from 'discordeno/types';

export default {
  name: 'levelmessage',
  description: 'Set the level up message',
  commandType: ['application', 'message'],
  category: 'levels',
  args: [
  
  ],
  userGuildPermissions: ['MANAGE_GUILD'],
  async execute(client: AeonaBot, ctx: Context) {
    if (!ctx.guild || !ctx.user || !ctx.channel) return;

    async function sendMessage() {
      const data = await Schema.find({ Guild: `${ctx.guild!.id}` });
      const comp = new Components();
      comp.addButton('Auto Create', 'Primary', 'autocreate');
      comp.addButton('Create', 'Success', 'createconfig');
      if (data.length > 0)
        comp.addSelectComponent(
          'Edit/Delete a system.',
          'editoptions',
          data.map((c, i) => {
            return {
              label: `System ${i}`,
              value: `${i}`,
              description: `Edit/Delete the settings for System ${i}`,
            };
          }),

          'Edit/Delete the settings for your Level Systems',
        );
      else
        comp.addSelectComponent(
          'Edit/Delete a system.',
          'editoptions',
          [
            {
              label: 'No Systems',
              value: '-1',
            },
          ],

          'There are no systems to edit.',
          1,
          1,
          true,
        );

      const message = await client.extras.embed(
        {
          content: '',
          title: 'Level Setup',
          desc: `Choose a to edit/delete/create a system for down below. \n You currently have \`${data.length} systems\` setup. `,
          components: comp,
          type: 'editreply',
        },
        ctx,
      );

      client.amethystUtils
        .awaitComponent(message.id)
        .then(async (interaction) => {
          if (
            interaction.data?.customId == 'autocreate' ||
            interaction.data?.customId == 'createconfig'
          ) {
            const premium = await client.extras.isPremium(ctx.guildId!);

            if (!premium && data.length > 0) {
              await client.helpers.sendInteractionResponse(
                interaction.id,
                interaction.token,
                {
                  type: 4,
                  data: {
                    content: `Good day there, \nThis server appears to be non-premium, thus you can only have one system. \n\n  You can get premium for just **$2.99** at https://patreon.com/aeonicdiscord \n **or** \n *boost our support server*. \n Use \`+perks\` to see all the perks of premium. `,
                    flags: 1 << 6,
                  },
                },
              );
              return sendMessage();
            } else if (premium && data.length > 8) {
              await client.helpers.sendInteractionResponse(
                interaction.id,
                interaction.token,
                {
                  type: 4,
                  data: {
                    content: `Hello, despite the fact that this server is premium, you can only have a maximum of 8 systems owing to Discord ratelimits. Please accept my apologies for the inconvenience.`,
                    flags: 1 << 6,
                  },
                },
              );
              return sendMessage();
            }
          }

          if (interaction.data?.customId == 'autocreate') {
            const channel = await client.helpers.createChannel(ctx.guild!.id!, {
              name: 'level logs',
              type: ChannelTypes.GuildText,
            });

            new Schema({
              Guild: `${ctx.guildId}`,
              Channel: `${channel.id}`,
            }).save();

            await client.helpers.sendInteractionResponse(
              interaction.id,
              interaction.token,
              {
                type: 4,
                data: {
                  content: `I have successfully setup <#${channel.id}> as a level log channel.`,
                  flags: 1 << 6,
                },
              },
            );

            return sendMessage();
          } else if (interaction.data?.customId == 'createconfig') {
            let success = false;
            let invalidResponse = false;

            while (!success) {
              if (!invalidResponse) {
                await client.helpers.sendInteractionResponse(
                  interaction.id,
                  interaction.token,
                  {
                    type: 4,
                    data: {
                      content: `Please mention the channel or send cancel to cancel the setup.`,
                      flags: 1 << 6,
                    },
                  },
                );
              } else {
                await client.helpers.editOriginalInteractionResponse(
                  interaction.token,

                  {
                    content: `You didnt not mention a channel. Please mention the channel or send cancel to cancel the setup.`,
                  },
                );
              }

              const message = await client.amethystUtils
                .awaitMessage(ctx.user!.id, ctx.channel!.id)
                .catch();

              if (!message) return;

              if (message.content.toLowerCase() == 'cancel') {
                await client.helpers.sendInteractionResponse(
                  interaction.id,
                  interaction.token,
                  {
                    type: 4,
                    data: {
                      content: `Setup cancelled.`,
                      flags: 1 << 6,
                    },
                  },
                );
                return;
              }

              if (
                message.mentionedChannelIds &&
                message.mentionedChannelIds.length > 0
              ) {
                success = true;

                client.helpers
                  .deleteMessage(message.channelId, message.id)
                  .catch();

                new Schema({
                  Guild: `${ctx.guildId}`,
                  Channel: `${message.mentionedChannelIds[0]}`,
                }).save();

                await client.helpers.sendFollowupMessage(interaction.token, {
                  type: 4,
                  data: {
                    content: `I have successfully setup <#${message.mentionedChannelIds[0]}> as a level log channel.`,
                    flags: 1 << 6,
                  },
                });
              } else {
                invalidResponse = true;
              }
            }

            return sendMessage();
          } else if (interaction.data?.customId == 'editoptions') {
            const schema = data[Number(interaction.data.values![0])];

            const components = new Components();

            components.addButton('Set Channel', 'Primary', 'setchannel');
            components.addButton('Set Message', 'Primary', 'setmessage');
            components.addButton(
              'Delete this Setting',
              'Danger',
              'deleteconfig',
            );
            const mes = await client.extras.embed(
              {
                title: `System ${interaction.data.values![0]}`,
                desc: `
                <:F_Settings:1049292164103938128> **Settings**
                <:channel:1049292166343688192> Channel: <#${schema.Channel}>
                `,
                components: components,
                type: 'editreply',
              },
              ctx,
            );
            const config = await client.extras.getEmbedConfig(ctx);
            let m = {
              content:
                '**GG** {user:mention}, you are now level **{user:level}**!',
            };
            
            if (schema.Message) {
              try {
                m = JSON.parse(schema.Message);
              } catch (e) {
                //
              }
            }
            
            m.content = `**<:chatbot:1049292165282541638> Level Message :small_red_triangle_down:** \n ${m.content}`;
           
            client.helpers
              .sendMessage(
                ctx.channel!.id,
                client.extras.generateEmbedFromData(config, m),
              )
              .catch((e) => console.error(e));
            client.amethystUtils
              .awaitComponent(mes.id)
              .then(async (interaction) => {
                if (interaction.data?.customId == 'setchannel') {
                  let success = false;
                  let invalidResponse = false;

                  while (!success) {
                    if (!invalidResponse) {
                      await client.helpers.sendInteractionResponse(
                        interaction.id,
                        interaction.token,
                        {
                          type: 4,
                          data: {
                            content: `Please mention the channel or send cancel to cancel the setup.`,
                            flags: 1 << 6,
                          },
                        },
                      );
                    } else {
                      await client.helpers.editOriginalInteractionResponse(
                        interaction.token,

                        {
                          content: `You didnt not mention a channel. Please mention the channel or send cancel to cancel the setup.`,
                        },
                      );
                    }

                    const message = await client.amethystUtils
                      .awaitMessage(ctx.user!.id, ctx.channel!.id)
                      .catch();

                    if (!message) return;

                    if (message.content.toLowerCase() == 'cancel') {
                      await client.helpers.sendFollowupMessage(
                        interaction.token,
                        {
                          type: 4,
                          data: {
                            content: `Setup cancelled.`,
                            flags: 1 << 6,
                          },
                        },
                      );
                      return;
                    }

                    if (
                      message.mentionedChannelIds &&
                      message.mentionedChannelIds.length > 0
                    ) {
                      success = true;

                      client.helpers
                        .deleteMessage(message.channelId, message.id)
                        .catch();

                      schema.Channel = `${message.mentionedChannelIds[0]}`;
                      schema.save();

                      await client.helpers.sendFollowupMessage(
                        interaction.token,
                        {
                          type: 4,
                          data: {
                            content: `I have successfully setup <#${message.mentionedChannelIds[0]}> as a level channel.`,
                            flags: 1 << 6,
                          },
                        },
                      );
                    } else {
                      invalidResponse = true;
                    }
                  }

                  return sendMessage();
                } else if (interaction.data?.customId == 'setmessage') {
                  await client.helpers.sendInteractionResponse(
                    interaction.id,
                    interaction.token,
                    {
                      type: 4,
                      data: {
                        content: `I am loading the message editor. To see a list of variables you can use look at \`/embed variables\``,
                        flags: 1 << 6,
                      },
                    },
                  );
                  let message = {
                    content:
                      '**GG** {user:mention}, you are now level **{user:level}**!',
                  };

                  if (schema.Message) {
                    try {
                      message = JSON.parse(schema.Message);
                    } catch (e) {
                      //
                    }
                  }

                  client.extras.createInterface(ctx, '', {
                    ...message,

                    callback: async (data) => {
                      schema.Message = JSON.stringify(data);

                      schema.save();
                      await client.helpers.sendFollowupMessage(
                        interaction.token,
                        {
                          type: 4,
                          data: {
                            content: `I have successfully updated the message for that config.`,
                            flags: 1 << 6,
                          },
                        },
                      );

                      sendMessage();
                    },
                  });
                } else if (interaction.data?.customId == 'deleteconfig') {
                  schema.delete();
                  await client.helpers.sendInteractionResponse(
                    interaction.id,
                    interaction.token,
                    {
                      type: 4,
                      data: {
                        content: `I have successfully deleted that config`,
                        flags: 1 << 6,
                      },
                    },
                  );

                  return sendMessage();
                }
              })
              .catch((e) => {
                client.helpers.editMessage(mes.channelId, mes.id, {
                  content: 'This command has expired.',
                  components: [],
                });
              });
          } 
        })
        .catch((e) => {
          client.helpers.editMessage(message.channelId, message.id, {
            content: 'This command has expired.',
            components: [],
          });
        });
    }
    await client.extras.embed(
      {
        content: 'Loading....',
      },
      ctx,
    );
    sendMessage();
  },
} as CommandOptions;
