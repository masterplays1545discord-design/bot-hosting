require('dotenv').config();
const { 
    Client,
    GatewayIntentBits,
    EmbedBuilder, 
    AttachmentBuilder
} = require('discord.js');

// CREATE CLIENT
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ]
});

// TERMS OF USE MESSAGE
client.once('ready', async () => {

    // IMAGE ATTACHMENT (LOCAL FILE)
    const image = new AttachmentBuilder('D:/Hesi Productions/terms.png', { name: 'terms.png' });

    const channel = await client.channels.fetch("1359800093867376670");
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
        .setTitle("Hesi Productions • Terms of Use")
        .setDescription(
`-# *All members and participants in Hesi Productions Roblox group, Discord server, and affiliated platforms. By joining or participating in Hesi Productions, you agree to follow these Terms of Use. These rules ensure a safe, respectful, and productive environment for all members.*

**General Conduct**  
Members must behave responsibly and respectfully. Disruptive actions, harassment, or offensive behavior are not allowed.

**Communication**  
Speak politely and professionally. Hate speech, bullying, threats, explicit content, and trolling are strictly prohibited.

**Privacy**  
Do not share personal information or leak private conversations, recordings, or staff discussions.

**Promotion**  
Advertising is allowed only in designated channels. No unsolicited promotional DMs or link spam.

**Platform Compliance**  
Follow Roblox and Discord rules. Exploits, hacks, or unfair advantages are forbidden.

**Authority**  
Staff may enforce rules. Follow moderator instructions.

**Reports**  
Report issues respectfully and with evidence. False reports may result in punishment.

**Ownership**  
All scripts, models, artwork, and assets belong to Hesi Productions.

**Prohibited Actions**  
• Resale or redistribution of assets is strictly prohibited.  
• Unauthorized modification or republishing of assets is not allowed.

**Refunds**  
All digital products, commissions, or assets are **non-refundable**.

**Enforcement**  
Violations may result in warnings, mutes, kicks, bans, or DMCA action.

-# ***Hesi Productions may update or enforce these Terms at any time. By purchasing or using any Hesi Productions assets, you agree to comply with these Terms.***`
        )
        .setColor(0xE91E63)
        .setImage('attachment://terms.png')
        .setFooter({ text: "Hesi Productions • Terms of Use" });

    await channel.send({
        embeds: [embed],
        files: [image]  // attach file
    });

    console.log("Terms of Use sent successfully.");
});

// LOGIN
client.login(process.env.TOKEN);
