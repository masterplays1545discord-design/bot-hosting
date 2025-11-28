require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    Events, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ModalSubmitInteraction 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

// ---------- CONFIG ----------
const VERIFY_ROLE_ID = "1363790397222031513"; // role to give
const UNVERIFIED_ROLE_ID = "1414009865214492873"; // role to remove after verification
const VERIFY_CHANNEL_ID = "1419770233396138015"; // channel to send the embed

// ---------- READY ----------
client.once('ready', async () => {
    console.log(`${client.user.tag} is online!`);

    const channel = await client.channels.fetch(VERIFY_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
        .setTitle("Captcha Verification")
        .setDescription("Click the button below to start verification. Solve the CAPTCHA to get access!")
        .setColor(0xe91e63)
        .setFooter({ text: "𝗛𝗘𝗦𝗜 𝗣𝗥𝗢𝗗𝗨𝗖𝗧𝗜𝗢𝗡𝗦 • Verification" });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("start_captcha")
                .setLabel("Start Verification")
                .setStyle(ButtonStyle.Primary)
        );

    channel.send({ embeds: [embed], components: [row] });
});

// ---------- BUTTON INTERACTION ----------
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "start_captcha") {
        // Simple math CAPTCHA
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const answer = num1 + num2;

        // Create modal
        const modal = new ModalBuilder()
            .setCustomId(`captcha_modal_${answer}`) // store answer in customId
            .setTitle("Captcha Verification");

        const input = new TextInputBuilder()
            .setCustomId("captcha_input")
            .setLabel(`What is ${num1} + ${num2}?`)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }
});

// ---------- MODAL SUBMISSION ----------
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId.startsWith("captcha_modal_")) {
        const correctAnswer = interaction.customId.split("_")[2];
        const userAnswer = interaction.fields.getTextInputValue("captcha_input");

        if (userAnswer === correctAnswer) {
            const member = interaction.member;

            // Check if already verified
            if (member.roles.cache.has(VERIFY_ROLE_ID)) {
                return interaction.reply({ content: "✅ You are already verified!", ephemeral: true });
            }

            // Add the verified role
            await member.roles.add(VERIFY_ROLE_ID).catch(console.error);

            // Remove the unverified role
            const unverifiedRole = member.guild.roles.cache.get(UNVERIFIED_ROLE_ID);
            if (unverifiedRole) {
                await member.roles.remove(unverifiedRole).catch(console.error);
            }

            interaction.reply({ content: "✅ Verification complete! You now have access.", ephemeral: true });
        } else {
            interaction.reply({ content: "❌ Wrong answer. Please try again.", ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
