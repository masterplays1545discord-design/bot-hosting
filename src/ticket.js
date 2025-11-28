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
const CATEGORY_APPLICATION = "1439090078214389902";
const CATEGORY_PARTNERSHIP = "1417489234918637668";

let ticketCount = 0;

// ================= READY =================
client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    // Ticket panel
    const ticketPanel = client.channels.cache.get("1361990250108420177");
    if (!ticketPanel) return;

    // const attachment = new AttachmentBuilder('./Hesi Productions Logo.png', { name: 'Hesi Productions Logo.png' });

    const ticketEmbed = new EmbedBuilder()
        .setTitle("🎫 Contact Us")
        .setDescription(
            "Need support? Press one of the buttons below that match your inquiry the best — whether you need help, want to make a purchase, or are interested in a partnership. Our team is ready to assist you quickly and efficiently.\n\n" +
            "**🛠️ Support**\nOpen a ticket for troubleshooting, product guidance, or general questions.\n\n" +
            "**📄 Applications**\nOpen this ticket to apply for jobs, roles, or collaborations within Hesi Productions.\n\n" +
            "**🤝 Partnerships**\nOpen a ticket to collaborate with us for mutual growth and promotion."
        )
        // .setImage("attachment://Hesi Productions Logo.png")
        .setColor(0xe91e63)
        .setFooter({ text: "Hesi Productions Support" })
        .setTimestamp();

    const ticketRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("ticket_support")
            .setLabel("Support")
            .setEmoji("🛠️")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId("ticket_application")
            .setLabel("Applications")
            .setEmoji("📄")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId("ticket_partnership")
            .setLabel("Partnerships")
            .setEmoji("🤝")
            .setStyle(ButtonStyle.Danger)
    );

    await ticketPanel.send({ 
        embeds: [ticketEmbed], 
        // files: [attachment], // directly here
        components: [ticketRow] 
    });

    console.log("Ticket panel sent!");
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

    // ===== CREATE TICKET =====
    const types = {
        "ticket_support": { name: "Support", emoji: "🛠️", category: CATEGORY_SUPPORT },
        "ticket_application": { name: "Application", emoji: "📄", category: CATEGORY_APPLICATION },
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
