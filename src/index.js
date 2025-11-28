require('dotenv').config();
const { 
    Client, 
    IntentsBitField, 
    EmbedBuilder,
    ActivityType,
    GatewayIntentBits,
    Partials,
    Collection
} = require('discord.js');
const fs = require('fs');
const ms = require('ms');

require("./information.js");
require("./register-commands.js");
require("./ticket.js");
require("./verification.js");
require("./welcome.js");
require("./terms.js");

const PREFIX = "!";

// -------------------- CONFIG --------------------
// Put your moderation log channel ID here
const MOD_LOG_CHANNEL_ID = "1437751350913007687";

// -------------------- CLIENT --------------------
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        GatewayIntentBits.GuildInvites
    ],
    partials: [Partials.GuildMember]
});

// -------------------- DATA STORAGE --------------------
const punishmentsPath = "./punishments.json";
let punishments = {};

// Create punishments.json automatically if it doesn't exist
if (!fs.existsSync(punishmentsPath)) {
    fs.writeFileSync(punishmentsPath, JSON.stringify({}, null, 2));
}

// Load punishments safely
try {
    punishments = JSON.parse(fs.readFileSync(punishmentsPath, "utf8"));
} catch (err) {
    console.error("Failed to load punishments.json:", err);
    punishments = {};
}

function savePunishments() {
    fs.writeFileSync(punishmentsPath, JSON.stringify(punishments, null, 2));
}

// -------------------- ADD PUNISHMENT FUNCTION --------------------
async function addPunishment({ userId, moderatorTag, type, reason, duration, guild }) {
    if (!punishments[userId]) punishments[userId] = [];
    const id = punishments[userId].length + 1;
    const entry = {
        id,
        type,
        issuedBy: moderatorTag,
        reason,
        duration: duration || null,
        date: new Date().toISOString()
    };
    punishments[userId].push(entry);
    savePunishments();

    // Send to moderation log channel
    if (MOD_LOG_CHANNEL_ID && guild) {
        const modChannel = guild.channels.cache.get(MOD_LOG_CHANNEL_ID);
        if (modChannel && modChannel.isTextBased()) {
            const dateStr = new Date(entry.date).toLocaleString();
            const embed = new EmbedBuilder()
                .setTitle(`New Punishment Issued`)
                .setColor(0xe91e63)
                .setDescription(
                    `**Punishment ID:** ${entry.id}\n` +
                    `**Punishment:** ${entry.type}${entry.duration ? ` | Duration: ${entry.duration}` : ""}\n` +
                    `**User:** <@${userId}>\n` +
                    `**Reason:** ${reason}`
                )
                .setFooter({ text: `${moderatorTag} • Discord ID: ${guild.members.cache.get(userId)?.id || userId} • ${dateStr}` })
                .setTimestamp();
            modChannel.send({ embeds: [embed] });
        }
    }

    return entry;
}

// -------------------- INVITE CACHE --------------------
client.invitesCache = new Collection();

// -------------------- READY EVENT --------------------
client.on('ready', async () => {
    console.log(`${client.user.tag} is online.`);

    client.user.setPresence({
        activities: [{ name: 'Hesi Productions | v1.0', type: ActivityType.Playing }],
        status: 'online'
    });

    // Initialize invite cache
    client.guilds.cache.forEach(async guild => {
        const invites = await guild.invites.fetch();
        client.invitesCache.set(guild.id, invites);
    });

    console.log("Invite cache initialized.");
});

// -------------------- INVITE TRACKER --------------------
client.on('inviteCreate', async invite => {
    const invites = await invite.guild.invites.fetch();
    client.invitesCache.set(invite.guild.id, invites);
});

client.on('inviteDelete', async invite => {
    const invites = await invite.guild.invites.fetch();
    client.invitesCache.set(invite.guild.id, invites);
});

client.on('guildMemberAdd', async member => {
    const cachedInvites = client.invitesCache.get(member.guild.id);
    const newInvites = await member.guild.invites.fetch();
    const usedInvite = newInvites.find(i => cachedInvites.get(i.code)?.uses < i.uses);

    if (usedInvite) console.log(`${member.user.tag} joined using invite by ${usedInvite.inviter.tag}`);
    client.invitesCache.set(member.guild.id, newInvites);
});

client.on('guildMemberRemove', member => {
    console.log(`${member.user.tag} left the server.`);
});

// -------------------- HELPER --------------------
async function getUser(client, message, arg) {
    return message.mentions.users.first() || await client.users.fetch(arg).catch(() => null);
}

// -------------------- PREFIX COMMAND HANDLER --------------------
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // -------------------- BAN --------------------
    if (command === "ban") {
        if (!message.member.permissions.has("BanMembers")) return message.reply("❌ You don't have permission.");
        const user = await getUser(client, message, args[0]);
        if (!user) return message.reply("❌ Mention or ID required.");
        const member = message.guild.members.cache.get(user.id);
        if (!member) return message.reply("❌ User not found.");

        const reason = args.slice(1).join(" ") || "No reason";
        await member.ban({ reason });

        const entry = await addPunishment({
            userId: user.id,
            moderatorTag: message.author.tag,
            type: "Ban",
            reason,
            guild: message.guild
        });

        message.reply(`🔨 Banned **${user.tag}** | Punishment ID: ${entry.id} | Reason: ${reason}`);
    }

    // -------------------- UNBAN --------------------
    if (command === "unban") {
        if (!message.member.permissions.has("BanMembers")) return message.reply("❌ You don't have permission.");
        const userId = args[0];
        if (!userId) return message.reply("❌ Provide a user ID.");

        message.guild.members.unban(userId)
            .then(() => message.reply(`✅ Unbanned <@${userId}>`))
            .catch(() => message.reply("❌ User is not banned."));
    }

    // -------------------- KICK --------------------
    if (command === "kick") {
        if (!message.member.permissions.has("KickMembers")) return message.reply("❌ No permission.");
        const user = await getUser(client, message, args[0]);
        if (!user) return message.reply("❌ Mention or ID required.");
        const member = message.guild.members.cache.get(user.id);
        if (!member) return message.reply("❌ User not found.");
        const reason = args.slice(1).join(" ") || "No reason";

        await member.kick(reason);
        const entry = await addPunishment({
            userId: user.id,
            moderatorTag: message.author.tag,
            type: "Kick",
            reason,
            guild: message.guild
        });

        message.reply(`👢 Kicked **${user.tag}** | Punishment ID: ${entry.id} | Reason: ${reason}`);
    }

    // -------------------- WARN --------------------
    if (command === "warn") {
        const user = await getUser(client, message, args[0]);
        if (!user) return message.reply("❌ Mention or ID required.");
        const reason = args.slice(1).join(" ") || "No reason";

        const entry = await addPunishment({
            userId: user.id,
            moderatorTag: message.author.tag,
            type: "Warn",
            reason,
            guild: message.guild
        });

        message.reply(`⚠️ Warned **${user.tag}** | Punishment ID: ${entry.id} | Reason: ${reason}`);
    }

    // -------------------- UNWARN --------------------
    if (command === "unwarn") {
        const user = await getUser(client, message, args[0]);
        if (!user) return message.reply("❌ Mention or ID required.");
        const idArg = args[1]; // Punishment ID to remove
        if (!punishments[user.id] || punishments[user.id].length === 0) return message.reply("❌ This user has no punishments.");

        if (!idArg) return message.reply("❌ Please provide a Punishment ID to remove.");

        const idToRemove = parseInt(idArg);
        const index = punishments[user.id].findIndex(p => p.type === "Warn" && p.id === idToRemove);
        if (index === -1) return message.reply(`❌ No warn found with Punishment ID: ${idToRemove}`);

        punishments[user.id].splice(index, 1);

        // Reassign IDs so they stay sequential
        punishments[user.id].forEach((p, i) => p.id = i + 1);

        savePunishments();
        message.reply(`♻️ Removed warn with Punishment ID ${idToRemove} from **${user.tag}**`);
    }

    // -------------------- MUTE --------------------
    if (command === "mute") {
        if (!message.member.permissions.has("ModerateMembers")) return message.reply("❌ No permission.");
        const user = await getUser(client, message, args[0]);
        if (!user) return message.reply("❌ Mention or ID required.");
        const member = message.guild.members.cache.get(user.id);
        if (!member) return message.reply("❌ User not found.");

        const durationArg = args[1] || "10m";
        const reason = args.slice(2).join(" ") || "No reason";

        await member.timeout(ms(durationArg), reason);

        const entry = await addPunishment({
            userId: user.id,
            moderatorTag: message.author.tag,
            type: "Mute",
            reason,
            duration: durationArg,
            guild: message.guild
        });

        message.reply(`🔇 Muted **${user.tag}** for ${durationArg} | Punishment ID: ${entry.id} | Reason: ${reason}`);
    }

    // -------------------- LOCK --------------------
    if (command === "lock") {
        if (!message.member.permissions.has("ManageChannels")) return message.reply("❌ No permission.");
        await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: false });
        message.reply("🔒 Channel locked.");
    }

    // -------------------- UNLOCK --------------------
    if (command === "unlock") {
        if (!message.member.permissions.has("ManageChannels")) return message.reply("❌ No permission.");
        await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: true });
        message.reply("🔓 Channel unlocked.");
    }

    // -------------------- INVITE --------------------
    if (command === "invite") {
        const invite = await message.channel.createInvite({ maxAge: 0, maxUses: 0 });
        message.reply(`🔗 Invite: ${invite.url}`);
    }

    // -------------------- VIEW PUNISHMENTS --------------------
    // -------------------- VIEW PUNISHMENTS --------------------
if (command === "punishments") {
    const user = await getUser(client, message, args[0]);
    if (!user) return message.reply("❌ Mention or ID required.");

    const list = punishments[user.id] || [];
    if (list.length === 0) return message.reply(`✅ **${user.tag}** has no punishments.`);

    const embed = new EmbedBuilder()
        .setTitle(`Punishments for ${user.tag}`)
        .setColor(0xe91e63)
        .setDescription(list.map(p => {
            return (
                `**Punishment ID:** ${p.id}\n` +
                `**Punishment:** ${p.type}${p.duration ? ` | Duration: ${p.duration}` : ""}\n` +
                `**Reason:** ${p.reason}\n---`
            );
        }).join("\n"))
        .setFooter({
            text: (() => {
                const last = list[list.length - 1];
                const dateStr = new Date(last.date).toLocaleString();
                const memberId = message.guild.members.cache.find(m => m.user.tag === last.issuedBy)?.id || "Unknown";
                return `${last.issuedBy} • Discord ID: ${memberId} • ${dateStr}`;
            })()
        });

    message.reply({ embeds: [embed] });
}

});

// -------------------- LOGIN --------------------
client.login(process.env.TOKEN);
