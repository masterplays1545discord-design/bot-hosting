require('dotenv').config();
const { Client, IntentsBitField, EmbedBuilder, ActivityType } = require('discord.js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

client.on('ready', (c) => {
    console.log(`${c.user.tag} is online.`);

    client.user.setPresence({
        activities: [
            {
                name: 'Hesi Productions | v1.0',
                type: ActivityType.Playing, // Options: Playing, Watching, Listening, Competing
            },
        ],
        status: 'online', // Options: online, idle, dnd, invisible
    });
});



client.on('interactionCreate', async (interaction) => {

    try {
        // Handle button clicks first
        if (interaction.isButton()) {
            const role = interaction.guild.roles.cache.get(interaction.customId);
            if (!role) return interaction.reply({ content: "I couldn't find that role.", ephemeral: true });

            const member = interaction.member;
            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role);
                return interaction.reply({ content: `Role <@&${role.id}> removed!`, ephemeral: true });
            } else {
                await member.roles.add(role);
                return interaction.reply({ content: `Role <@&${role.id}> added!`, ephemeral: true });
            }
        }

        // Handle slash commands
        if (!interaction.isChatInputCommand()) return;

        if (interaction.commandName == 'help') {
            await interaction.reply('App made by *kay.8195*'); 
        }

        if (interaction.commandName === 'embed') {
            await interaction.deferReply({ ephemeral: true });

            const title = interaction.options.getString('title');
            const desc = interaction.options.getString('description');
            const fieldName = interaction.options.getString('field_name');
            const fieldValue = interaction.options.getString('field_value');
            const channel = interaction.options.getChannel('channel');
            const user = interaction.options.getUser('mention_user');
            const role = interaction.options.getRole('mention_role');
            const pingType = interaction.options.getString('ping_type') || 'none';

            if (!channel || !channel.isTextBased()) {
                return interaction.editReply({ content: 'Please select a text channel.' });
            }

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(desc)
                .setColor(0xe91e63);

            if (fieldName && fieldValue) embed.addFields({ name: fieldName, value: fieldValue, inline: true });

            let content = '';
            if (pingType === 'here') content += '@here ';
            if (pingType === 'everyone') content += '@everyone ';
            if (user) content += `<@${user.id}> `;
            if (role) content += `<@&${role.id}> `;

            try {
                await channel.send({
                    content: content || null,
                    embeds: [embed],
                    allowedMentions: {
                        users: user ? [user.id] : [],
                        roles: role ? [role.id] : [],
                        parse: pingType === 'here' || pingType === 'everyone' ? ['everyone'] : [] 
                    }
                });
                await interaction.editReply({ content: `Embed sent in ${channel}!` });
            } catch (err) {
                await interaction.editReply({ content: `Failed to send embed: ${err.message}` });
            }
        }
    } catch (error) {
        console.log(error);
    }

});


// client.on('messageCreate', (message) => {
//     // console.log(message.content);
//     if (message.author.bot) {
//         return;
//     }

//     if (message.content == 'hello') {
//         message.reply('Hello!');
//     }
// });

client.login(process.env.TOKEN);