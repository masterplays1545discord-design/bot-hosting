require('dotenv').config();
const { 
    Client, 
    IntentsBitField, 
    ActionRowBuilder, 
    EmbedBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    AttachmentBuilder
} = require('discord.js');
const fs = require("fs");

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

// ===== CONFIG =====
const STAFF_ROLE_ID = "1414242670058148023";
const LOG_CHANNEL_ID = "1414249704426045531";

const roles = [
    { id: '1414189877850800179', label: '📢 Announcement' },
    { id: '1414190108738977933', label: '🎁 Giveaway' },
    { id: '1414189488841691207', label: '🤝 Partnership' },
];

let ticketCount = 0;

// ================= READY =================
client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    const welcomeChannel = client.channels.cache.get('1361985446132842596');
    if (!welcomeChannel || !welcomeChannel.isTextBased()) return;

    // Welcome embeds
    const embed1 = new EmbedBuilder()
        .setTitle('Welcome to Hesi Productions!')
        .setDescription('We are known for creating high-quality, innovative experiences. With sleek design and advanced programming, we polished games, systems, and tools for the Roblox community — **all at affordable prices.**')
        .setColor(0xe91e63);

    const embed2 = new EmbedBuilder()
        .setTitle('Getting Started')
        .addFields(
            { 
    name: 'Rules', 
    value: 'Make sure to read all the server rules carefully in ⁠<#1359800093867376670>. Following the rules ensures a safe and friendly environment for everyone. Breaking the rules may result in warnings or bans.' 
},
{ 
    name: 'Purchases', 
    value: 'Check out our products and make purchases safely at ⁠<#1361987847523143822>. Ensure you follow the instructions and provide the correct details for your order. Keep your receipts for any future issues.' 
},
{ 
    name: 'Updates', 
    value: 'Stay informed about the latest server news, product releases, and announcements in ⁠<#1358418972822868078>. This channel will keep you up-to-date with everything important happening in Hesi Productions.' 
},
{ 
    name: 'Community', 
    value: 'Join discussions, make friends, and chat with the community in ⁠<#1437418428364230668>. Respect everyone, avoid spamming, and contribute positively to the community vibes.' 
},
{ 
    name: 'Support', 
    value: 'If you need help or have issues, open a support ticket in ⁠<#1361990250108420177>. Our staff will respond as quickly as possible to resolve your concerns. Provide all necessary details for faster assistance.' 
}

        )
        .setColor(0xe91e63);

    const embed3 = new EmbedBuilder()
        .setTitle('Next Steps')
        .setDescription(
    'Explore our wide range of products, give suggestions to improve the server, share your ideas, or even apply for a job with us! ' +
    'Join the community, stay updated with news, and take part in fun events and discussions.'
)

        .setFooter({ text: 'Thank you from Hesi Productions Staff Team!' })
        .setColor(0xe91e63);

    await welcomeChannel.send({ embeds: [embed1, embed2, embed3] });

    // Role buttons
    const roleRow = new ActionRowBuilder().addComponents(
        ...roles.map(r =>
            new ButtonBuilder()
                .setCustomId(r.id)
                .setLabel(r.label)
                .setStyle(ButtonStyle.Primary)
        )
    );
    await welcomeChannel.send({
        embeds: [new EmbedBuilder().setTitle('Claim Your Roles').setDescription('Click to add/remove roles.').setColor(0xe91e63)],
        components: [roleRow]
    });

    console.log("Information sent!");
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

    // ===== ROLE BUTTONS =====
    const roleButton = roles.find(r => r.id === interaction.customId);
    if (roleButton) {
        const member = interaction.member;
        if (member.roles.cache.has(roleButton.id)) {
            await member.roles.remove(roleButton.id);
            return interaction.reply({ content: `Removed <@&${roleButton.id}>`, ephemeral: true });
        } else {
            await member.roles.add(roleButton.id);
            return interaction.reply({ content: `Added <@&${roleButton.id}>`, ephemeral: true });
        }
    }

});

client.login(process.env.TOKEN);
