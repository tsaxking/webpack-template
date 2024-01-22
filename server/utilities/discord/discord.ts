import { Client, GatewayIntentBits, SlashCommandBuilder } from 'npm:discord.js';
import env from '../env.ts';
import Ping from './commands/ping.ts';

export type Command = {
    name: string;
    description: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute: (interaction: any) => void;
    data?: SlashCommandBuilder;
};

const commands: Command[] = [Ping];

export const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

client.on('ready', () => {
    // set up commands

    console.log('Discord bot ready');

    // loop through guilds
    for (const guild of client.guilds.cache.values()) {
        guild.commands.set(commands.map((c) => (c.data ? c.data.toJSON() : c)));
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        const cmd = commands.find((c) => c.name === interaction.commandName);
        if (cmd) cmd.execute(interaction);
    }
});

if (env.DISCORD_TOKEN) client.login(env.DISCORD_TOKEN);
