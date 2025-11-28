require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // Needed for guildMemberAdd
        GatewayIntentBits.GuildMessages
    ]
});

const WELCOME_CHANNEL_ID = "1361985606376226836"; // Replace with your channel ID
const AUTO_ROLE_ID = "1414009865214492873"; // Replace with the role ID you want to assign automatically
const guildInvites = new Map(); // Cache invites per guild

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.guilds.cache.forEach(async guild => {
        const invites = await guild.invites.fetch();
        guildInvites.set(guild.id, invites);
    });
});

// Update cache when new invite is created
client.on('inviteCreate', async invite => {
    const invites = await invite.guild.invites.fetch();
    guildInvites.set(invite.guild.id, invites);
});

client.on('guildMemberAdd', async (member) => {
    try {
        // Assign auto role
        const role = member.guild.roles.cache.get(AUTO_ROLE_ID);
        if (role) {
            await member.roles.add(role);
            console.log(`Assigned role ${role.name} to ${member.user.tag}`);
        } else {
            console.log(`Role with ID ${AUTO_ROLE_ID} not found.`);
        }

        // Fetch the channel
        const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID);
        if (!channel || !channel.isTextBased()) return;

        // Calculate account age in days
        const accountAgeDays = Math.floor((Date.now() - member.user.createdTimestamp) / 86400000);

        // Invite tracker
        const newInvites = await member.guild.invites.fetch();
        const oldInvites = guildInvites.get(member.guild.id);
        let inviter = null;

        newInvites.forEach(inv => {
            const oldUses = oldInvites?.get(inv.code)?.uses || 0;
            if (inv.uses > oldUses) {
                inviter = inv.inviter; // This is the User who invited
            }
        });

        // Update cache
        guildInvites.set(member.guild.id, newInvites);

        // Create attachment
        const welcomeImage = new AttachmentBuilder('D:/Hesi Productions/welcome.png', { name: 'welcome.png' });

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(`Welcome to Hesi Productions!`)
            .setDescription(
                `Welcome <@${member.id}> to Hesi Productions! We are excited to have you here.\n\n` +
                `**Account age:** ${accountAgeDays} day(s)\n` +
                `**Discord ID:** ${member.id}\n` + (inviter ? `**Invited by:** <@${inviter.id}>` : `**Invited by:** Unknown`)
            )
            .setColor(0xe91e63)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setImage('attachment://welcome.png')
            .setFooter({ 
                text: `Hesi Productions • Official Welcome • Joined: ${new Date(member.joinedTimestamp).toLocaleString()}` 
            });

        // Send the welcome message
        await channel.send({
            embeds: [embed],
            files: [welcomeImage]
        });

        await channel.send({
            content: `-# By joining this server, you agree to comply with the [Hesi Productions Terms of Use](https://discord.com/channels/1357681816500175088/1361985446132842596).`,
        });

    } catch (error) {
        console.error("Error sending welcome message:", error);
    }
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
