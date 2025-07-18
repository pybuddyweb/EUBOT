// index.js
require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Partials
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel]
});

const logChannels = {
  vcJoin: '1394620942298386442',
  vcDrag: '1394620786601365534',
  vcLeave: '1394620679638220881',
  deletedMsg: '1394622925067260009',
  role: '1394623252672020480',
  forward: '1394623486160539699',
  botActivity: '1394611649079672863',
  welcome: '1163807927262515265',
  bye: '1353826800429694996'
};

client.once('ready', () => {
  console.log(`✅ EUplay Bot Logged in as ${client.user.tag}`);
});

client.on('guildMemberAdd', async (member) => {
  try {
    const channel = await member.guild.channels.fetch(logChannels.welcome);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('🎫 Gang Boarding Pass')
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 Rowdy Name', value: `<@${member.id}>`, inline: true },
        { name: '🏢 Destination', value: `${member.guild.name}`, inline: true },
        { name: '💲 Role', value: 'Future Don?', inline: true },
        { name: '⏰ Time', value: `${new Date().toLocaleString()}`, inline: false }
      )
      .setDescription(`🔫 Welcome to the turf, blood & respect earn pananum.`)
      .setImage('https://media.discordapp.net/attachments/1391440312320131194/1394614683692040322/standard_3.gif')
      .setFooter({ text: 'Enuyirgal - Respect or Regret' });

    await channel.send({ content: `🔥 A new rowdy has arrived!`, embeds: [embed] });
  } catch (e) {
    console.error('Welcome error:', e);
  }
});

client.on('guildMemberRemove', async (member) => {
  try {
    const channel = await member.guild.channels.fetch(logChannels.bye);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('👋 Rowdy Left the Turf')
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setDescription(`💀 **${member.user.tag}** left the server... thug life isn’t for everyone.`)
      .setImage('https://media.discordapp.net/attachments/1391440312320131194/1394614683692040322/standard_3.gif')
      .setFooter({ text: 'Enuyirgal - Gang Rules' });

    await channel.send({ content: `💨 A rowdy has escaped...`, embeds: [embed] });
  } catch (e) {
    console.error('Bye error:', e);
  }
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  const content = msg.content.trim();

  try {
    // Forward command
    if (content.startsWith('!EU')) {
      const text = content.slice(3).trim();
      const logChannel = await client.channels.fetch(logChannels.forward);
      if (logChannel) {
        await logChannel.send({
          content: `📢 ${msg.author.tag}: ${text}`,
          allowedMentions: { parse: ['users', 'roles', 'everyone'] }
        });
      }
      await msg.delete().catch(() => {});
    }

    // Block all links except YouTube in allowed channel
    const linkRegex = /(http:\/\/|https:\/\/|discord\.gg\/)/i;
    const ytOk = /youtube\.com|youtu\.be/i;
    if (linkRegex.test(content) && (!ytOk.test(content) || msg.channel.id !== '1329764758303281173')) {
      await msg.delete().catch(() => {});
      const log = await client.channels.fetch(logChannels.botActivity);
      log?.send(`🚫 Blocked suspicious link from ${msg.author.tag}: \`${content}\``);
    }
  } catch (e) {
    console.error('MessageCreate error:', e);
  }
});

client.on('messageDelete', async (message) => {
  if (message.partial || message.author?.bot) return;
  try {
    const log = await client.channels.fetch(logChannels.deletedMsg);
    log?.send(`🗑️ Message deleted from <@${message.author.id}> in <#${message.channel.id}>: ${message.content}`);
  } catch (e) {
    console.error('MessageDelete error:', e);
  }
});

client.on('voiceStateUpdate', (oldState, newState) => {
  const user = newState.member?.user || oldState.member?.user;
  if (!user) return;

  try {
    if (!oldState.channelId && newState.channelId) {
      client.channels.fetch(logChannels.vcJoin).then(c => c?.send(`🔊 ${user.tag} joined VC.`)).catch(() => {});
    } else if (oldState.channelId && !newState.channelId) {
      client.channels.fetch(logChannels.vcLeave).then(c => c?.send(`📤 ${user.tag} left VC.`)).catch(() => {});
    } else if (oldState.channelId !== newState.channelId) {
      client.channels.fetch(logChannels.vcDrag).then(c =>
        c?.send(`➡️ ${user.tag} moved from <#${oldState.channelId}> to <#${newState.channelId}>.`)).catch(() => {});
    }
  } catch (e) {
    console.error('VoiceStateUpdate error:', e);
  }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  try {
    const added = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    const removed = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
    const log = await client.channels.fetch(logChannels.role);
    added.forEach(role => log?.send(`✅ <@${newMember.id}> was **given** role: \`${role.name}\``));
    removed.forEach(role => log?.send(`❌ <@${newMember.id}> was **removed** role: \`${role.name}\``));
  } catch (e) {
    console.error('GuildMemberUpdate error:', e);
  }
});

client.login(process.env.TOKEN);
