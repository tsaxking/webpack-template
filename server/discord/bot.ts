import {
    CacheType,
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    REST,
    Routes,
    Client,
    GatewayIntentBits
} from 'discord.js';
import { attemptAsync } from '../../shared/check';
import env from '../utilities/env';

type Action = (
    interaction: ChatInputCommandInteraction<CacheType>
) => Promise<unknown>;

class Command {
    constructor(
        public readonly builder: SlashCommandBuilder,
        public readonly action: Action
    ) {}
}

class Bot {
    public readonly commands = new Map<string, Command>();
    private started = false;

    constructor(
        public readonly token: string,
        public readonly applicationId: string,
        public readonly clientSecret: string,
        public readonly publicKey: string,
        public readonly permission: string
    ) {}

    public on(name: string, description: string, action: Action) {
        if (this.started) throw new Error('Cannot add commands after starting');
        if (this.commands.has(name))
            throw new Error(`Command ${name} already exists`);
        const command = new SlashCommandBuilder()
            .setName(name)
            .setDescription(description);
        this.commands.set(name, new Command(command, action));
        return command;
    }

    public async start() {
        return attemptAsync(async () => {
            if (this.started) throw new Error('Bot is already started');
            this.started = true;
            const rest = new REST({ version: '10' }).setToken(this.token);
            await rest.put(Routes.applicationCommands(this.applicationId), {
                body: Array.from(this.commands.values(), c =>
                    c.builder.toJSON()
                )
            });
            const client = new Client({
                intents: [GatewayIntentBits.Guilds]
            });
            client.on('ready', () => {
                console.log(`Logged in as ${client.user?.tag}!`);
            });
            client.on('interactionCreate', async i => {
                if (!i.isChatInputCommand()) return;
                const command = this.commands.get(i.commandName);
                if (!command) return;
                const result = await attemptAsync(async () => {
                    if (command instanceof Command) command.action(i);
                    else await i.reply('This command is not yet implemented');
                });
                if (result.isErr()) {
                    console.error(result.error);
                    await i.reply(
                        'An error occurred while processing your command'
                    );
                }
            });
            client.login(this.token);
        });
    }
}

const {
    DISCORD_TOKEN,
    DISCORD_APPLICATION_ID,
    DISCORD_CLIENT_SECRET,
    DISCORD_PUBLIC_KEY,
    DISCORD_PERMISSION
} = env;
if (!DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is required');
if (!DISCORD_APPLICATION_ID)
    throw new Error('DISCORD_APPLICATION_ID is required');
if (!DISCORD_CLIENT_SECRET)
    throw new Error('DISCORD_CLIENT_SECRET is required');
if (!DISCORD_PUBLIC_KEY) throw new Error('DISCORD_PUBLIC_KEY is required');
if (!DISCORD_PERMISSION) throw new Error('DISCORD_PERMISSION is required');

export default new Bot(
    DISCORD_TOKEN,
    DISCORD_APPLICATION_ID,
    DISCORD_CLIENT_SECRET,
    DISCORD_PUBLIC_KEY,
    DISCORD_PERMISSION
);
