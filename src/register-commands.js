require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
    {
        name: 'help',
        description: 'Shows the help menu'
    },
    {
        name: 'embed',
        description: 'Sends an embed with optional pings',
        options: [
            // REQUIRED options first
            {
                name: 'title',
                description: 'Embed title',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'description',
                description: 'Embed description',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'channel',
                description: 'Channel to send the embed in',
                type: ApplicationCommandOptionType.Channel,
                required: true,
            },

            // OPTIONAL options
            {
                name: 'field_name',
                description: 'Field title',
                type: ApplicationCommandOptionType.String,
                required: false,
            },
            {
                name: 'field_value',
                description: 'Field value',
                type: ApplicationCommandOptionType.String,
                required: false,
            },
            {
                name: 'mention_user',
                description: 'User to ping',
                type: ApplicationCommandOptionType.User,
                required: false,
            },
            {
                name: 'mention_role',
                description: 'Role to ping',
                type: ApplicationCommandOptionType.Role,
                required: false,
            },
            {
                name: 'ping_type',
                description: 'Special mention type',
                type: ApplicationCommandOptionType.String,
                required: false,
                choices: [
                    { name: 'Here', value: 'here' },
                    { name: 'Everyone', value: 'everyone' },
                    { name: 'None', value: 'none' }
                ]
            }
        ]
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log('Slash commands were registered successfully!');
    } catch (error) {
        console.log(`There was an error: ${error}`);
    }
})();
