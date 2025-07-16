// index.js
require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Partials
} = require('discord.js');

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior,
  getVoiceConnection
} = require('@discordjs/voice');

const playdl = require('play-dl');

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

  channel.send({ content: `🔥 A new rowdy has arrived!`, embeds: [embed] });
});

client.on('guildMemberRemove', async (member) => {
  const channel = await member.guild.channels.fetch(logChannels.bye);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('👋 Rowdy Left the Turf')
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setDescription(`💀 **${member.user.tag}** left the server... thug life isn’t for everyone.`)
    .setImage('https://media.discordapp.net/attachments/1391440312320131194/1394614683692040322/standard_3.gif')
    .setFooter({ text: 'Enuyirgal - Gang Rules' });

  channel.send({ content: `💨 A rowdy has escaped...`, embeds: [embed] });
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  // Forward command
  const content = msg.content.trim();
  if (content.startsWith('!EU') && !content.startsWith('!EUplay')) {
    const text = content.slice(3).trim();
    const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/.+/i;

    if (ytRegex.test(text) || !text.includes('http')) {
      await msg.channel.send({
        content: `📢 ${msg.author.tag}: ${text}`,
        allowedMentions: { parse: ['users', 'roles', 'everyone'] }
      });
    } else {
      await msg.channel.send(`❌ Only YouTube links or plain text allowed.`);
    }
    await msg.delete().catch(() => {});
  }

  // Link blocker
  const linkRegex = /(http:\/\/|https:\/\/|discord\.gg\/)/i;
  const ytOk = /youtube\.com|youtu\.be/i;
  if (linkRegex.test(content) && !ytOk.test(content) && !content.startsWith('!EU')) {
    await msg.delete().catch(() => {});
    const log = await client.channels.fetch(logChannels.botActivity);
    log?.send(`🚫 Blocked suspicious link from ${msg.author.tag}: \`${content}\``);
  }

  // MUSIC: !play <song>
  if (msg.content.startsWith('!play')) {
    const query = msg.content.slice(5).trim();
    if (!query) return msg.reply('❌ Please provide a song name or link.');

    const vc = msg.member.voice.channel;
    if (!vc) return msg.reply('❌ Join a voice channel first.');

    try {
      const result = await playdl.search(query, { limit: 1 });
      const video = result[0];
      const stream = await playdl.stream(video.url);

      const resource = createAudioResource(stream.stream, { inputType: stream.type });
      const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
      player.play(resource);

      const connection = joinVoiceChannel({
        channelId: vc.id,
        guildId: vc.guild.id,
        adapterCreator: vc.guild.voiceAdapterCreator
      });

      connection.subscribe(player);
      msg.channel.send(`🎶 Now Playing: **${video.title}**`);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });
    } catch (err) {
      console.error(err);
      msg.reply('❌ Failed to play song.');
    }
  }

  // MUSIC: !pause
  if (msg.content === '!pause') {
    const connection = getVoiceConnection(msg.guild.id);
    if (!connection) return msg.reply('❌ Not connected to any VC.');
    const player = connection.state.subscription?.player;
    player?.pause();
    msg.channel.send('⏸️ Paused.');
  }

  // MUSIC: !resume
  if (msg.content === '!resume') {
    const connection = getVoiceConnection(msg.guild.id);
    if (!connection) return msg.reply('❌ Not connected to any VC.');
    const player = connection.state.subscription?.player;
    player?.unpause();
    msg.channel.send('▶️ Resumed.');
  }
});

client.on('messageDelete', async (message) => {
  if (message.partial || message.author?.bot) return;
  const log = await client.channels.fetch(logChannels.deletedMsg);
  log?.send(`🗑️ Message deleted from <@${message.author.id}> in <#${message.channel.id}>: ${message.content}`);
});

client.on('voiceStateUpdate', (oldState, newState) => {
  const user = newState.member?.user || oldState.member?.user;
  if (!user) return;

  if (!oldState.channelId && newState.channelId) {
    client.channels.fetch(logChannels.vcJoin).then(c => c?.send(`🔊 ${user.tag} joined VC.`)).catch(() => {});
  } else if (oldState.channelId && !newState.channelId) {
    client.channels.fetch(logChannels.vcLeave).then(c => c?.send(`📤 ${user.tag} left VC.`)).catch(() => {});
  } else if (oldState.channelId !== newState.channelId) {
    client.channels.fetch(logChannels.vcDrag).then(c =>
      c?.send(`➡️ ${user.tag} moved from <#${oldState.channelId}> to <#${newState.channelId}>.`)
    ).catch(() => {});
  }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const added = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
  const removed = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
  const log = await client.channels.fetch(logChannels.role);
  added.forEach(role => log?.send(`✅ <@${newMember.id}> was **given** role: \`${role.name}\``));
  removed.forEach(role => log?.send(`❌ <@${newMember.id}> was **removed** role: \`${role.name}\``));
});

client.login(process.env.TOKEN);
