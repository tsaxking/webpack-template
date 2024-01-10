import { Command } from '../discord.ts';

export default {
    name: 'ping',
    description: 'Ping!',
    execute: async (interaction) => {
        await interaction.reply('Pong!');
    },
} as Command;
