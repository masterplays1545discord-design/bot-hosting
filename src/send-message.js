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

const CATEGORY_SUPPORT = "1439090052394385559";
const CATEGORY_PURCHASE = "1439090078214389902";
const CATEGORY_PARTNERSHIP = "1417489234918637668";

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
        .setDescription('We are an innovative tech company with products for all Roblox needs!')
        .setColor(0xe91e63);

    const embed2 = new EmbedBuilder()
        .setTitle('Getting Started')
        .addFields(
            { name: 'Rules', value: 'Read them in ⁠<#1359800093867376670>' },
            { name: 'Purchases', value: 'Buy products at ⁠<#1361987847523143822>' },
            { name: 'Updates', value: 'Latest updates in ⁠<#1358418972822868078>' },
            { name: 'Community', value: 'Chat in ⁠<#1437418428364230668>' },
            { name: 'Support', value: 'Open support tickets in ⁠<#1361990250108420177>' }
        )
        .setColor(0xe91e63);

    const embed3 = new EmbedBuilder()
        .setTitle('Next Steps')
        .setDescription('Explore products, give suggestions, or apply for a job!')
        .setFooter({ text: 'Thank you from Hesi Productions Staff!' })
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

    // Ticket panel
    const ticketPanel = client.channels.cache.get("1361990250108420177");
    if (!ticketPanel) return;

    const ticketEmbed = new EmbedBuilder()
        .setTitle("🎫 Support Tickets")
        .setDescription("Choose a ticket type below.")
        .setColor("#2b2d31");

    const ticketRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket_support").setLabel("Support").setEmoji("🛠️").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("ticket_purchase").setLabel("Purchase").setEmoji("💳").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("ticket_partnership").setLabel("Partnership").setEmoji("🤝").setStyle(ButtonStyle.Secondary)
    );

    await ticketPanel.send({ embeds: [ticketEmbed], components: [ticketRow] });

    console.log("Bot is ready and ticket panel sent!");
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

    // ===== ROLE BUTTONS =====
    if (roles.some(r => r.id === interaction.customId)) {
        const roleId = interaction.customId;
        const member = interaction.member;

        if (member.roles.cache.has(roleId)) {
            await member.roles.remove(roleId);
            return interaction.reply({ content: `Removed <@&${roleId}>`, ephemeral: true });
        } else {
            await member.roles.add(roleId);
            return interaction.reply({ content: `Added <@&${roleId}>`, ephemeral: true });
        }
    }

    // ===== CREATE TICKET =====
    const types = {
        "ticket_support": { name: "Support", emoji: "🛠️", category: CATEGORY_SUPPORT },
        "ticket_purchase": { name: "Purchase", emoji: "💳", category: CATEGORY_PURCHASE },
        "ticket_partnership": { name: "Partnership", emoji: "🤝", category: CATEGORY_PARTNERSHIP }
    };

    if (types[interaction.customId]) {
        ticketCount++;
        const data = types[interaction.customId];

        const channel = await interaction.guild.channels.create({
            name: `ticket-${ticketCount}`,
            type: 0,
            parent: data.category,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: ["ViewChannel"] },
                { id: interaction.user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
                { id: STAFF_ROLE_ID, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] }
            ]
        });

        const ticketEmbed = new EmbedBuilder()
            .setTitle(`${data.emoji} ${data.name} Ticket`)
            .setDescription("A staff member will assist you shortly.\nUse buttons below to **Claim** or **Close** the ticket.")
            .setColor("#2b2d31");

        const ticketRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("claim_ticket").setLabel("Claim").setStyle(ButtonStyle.Success).setEmoji("🎟️"),
            new ButtonBuilder().setCustomId("close_ticket").setLabel("Close").setStyle(ButtonStyle.Danger).setEmoji("🔒")
        );

        await channel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketEmbed], components: [ticketRow] });
        logChannel?.send(`📩 Ticket #${ticketCount} opened by <@${interaction.user.id}>`);
        return interaction.reply({ content: `Ticket created: ${channel}`, ephemeral: true });
    }

    // ===== CLAIM TICKET =====
    if (interaction.customId === "claim_ticket") {
        if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
            return interaction.reply({ content: "Only staff can claim tickets.", ephemeral: true });
        }

        await interaction.reply({ content: `Ticket claimed by <@${interaction.user.id}>`, ephemeral: false });
        return interaction.channel.send(`🛠️ **Claimed by <@${interaction.user.id}>**`);
    }

    // ===== CLOSE TICKET =====
    if (interaction.customId === "close_ticket") {
        const ticketChannel = interaction.channel;

        const confirmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("ticket_transcript")
                .setLabel("Generate Transcript")
                .setStyle(ButtonStyle.Primary)
                .setEmoji("📕"),
            new ButtonBuilder()
                .setCustomId("ticket_delete")
                .setLabel("Delete Ticket")
                .setStyle(ButtonStyle.Danger)
                .setEmoji("🗑️")
        );

        await ticketChannel.send({
            content: "📌 Choose what to do with this ticket:",
            components: [confirmRow]
        });

        await interaction.reply({ content: "✅ Close options sent.", ephemeral: true });
    }

    // ===== GENERATE TRANSCRIPT =====
    if (interaction.customId === "ticket_transcript") {
        const ticketChannel = interaction.channel;

        // Fetch all messages in ticket channel
        let allMessages = [];
        let lastId;
        while (true) {
            const options = { limit: 100 };
            if (lastId) options.before = lastId;

            const messages = await ticketChannel.messages.fetch(options);
            if (!messages.size) break;

            allMessages.push(...messages.values());
            lastId = messages.last().id;
        }

        allMessages = allMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

        let html = `<html><body><h1>Transcript - ${ticketChannel.name}</h1><hr>`;
        for (const msg of allMessages) {
            let content = msg.content || "";
            if (msg.attachments.size) {
                const urls = Array.from(msg.attachments.values()).map(a => a.url).join(" ");
                content += `<br><em>Attachments:</em> ${urls}`;
            }
            html += `<p><strong>${msg.author.tag}</strong>: ${content}</p>`;
        }
        html += "</body></html>";

        const filePath = `./${ticketChannel.name}-transcript.html`;
        await fs.promises.writeFile(filePath, html);

        if (logChannel) {
            await logChannel.send({
                content: `📕 Transcript for ${ticketChannel.name}`,
                files: [filePath]
            });
        }

        await interaction.update({
            content: "✅ Transcript generated and sent to logs.",
            components: []
        });
    }

    // ===== DELETE TICKET =====
    if (interaction.customId === "ticket_delete") {
        await interaction.update({
            content: "🗑️ Ticket deleted.",
            components: []
        });

        setTimeout(() => {
            interaction.channel.delete().catch(() => {});
        }, 500);
    }

});

client.login(process.env.TOKEN);
