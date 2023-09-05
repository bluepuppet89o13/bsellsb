const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

// Define your bot token
const token = 'MTE0ODM4NDczMjc2NjI5MDAwMA.G4g8bP.AzxY7goj5DqLW3c-I_jr_DYt_wm0W8CN7R7BsE';

// Define your application ID (get it from the Discord Developer Portal)
const clientId = '1148384732766290000';

// Define your guild ID (optional, for testing slash commands in a specific server)
const guildId = '1148337092196307106';

// Create a new Discord client with the necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Create a new REST client
const rest = new REST({ version: '10' }).setToken(token);

// Define a simple in-memory store for items and user coins
const items = [];
const userCoins = {};

// Set up event listener for when the bot is ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Set up event listener for when a slash command is executed
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options, user } = interaction;

  if (commandName === 'setitem') {
    // Handle the /setitem command (Admin Only)
    const isAdmin = interaction.member && interaction.member.permissions.has('ADMINISTRATOR');
    if (!isAdmin) {
      await interaction.reply('You do not have permission to use this command.', { ephemeral: true });
      return;
    }

    const itemName = options.getString('itemname');
    const itemType = options.getString('itemtype');
    const itemCode = options.getString('itemcode');
    const itemPrice = options.getInteger('itemprice');

    // Add the item to the store
    items.push({ name: itemName, type: itemType, code: itemCode, price: itemPrice });

    await interaction.reply(`Item "${itemName}" has been added to the store.`);
  } else if (commandName === 'buy') {
    // Handle the /buy command (Available to everyone)
    const itemCode = options.getString('itemcode');

    // Find the item with the specified code
    const selectedItem = items.find((item) => item.code === itemCode);

    if (!selectedItem) {
      await interaction.reply('Item not found.', { ephemeral: true });
      return;
    }

    const userCoinsBalance = userCoins[user.id] || 0;

    if (userCoinsBalance < selectedItem.price) {
      await interaction.reply('You do not have enough coins to purchase this item.', { ephemeral: true });
      return;
    }

    // Deduct coins from the user
    userCoins[user.id] -= selectedItem.price;

    // Send a plain text message to the user's DM
    const dmChannel = await user.createDM();
    dmChannel.send(`You have purchased ${selectedItem.name}.`);

    await interaction.reply(`You have purchased ${selectedItem.name}. Check your DMs for details.`);
  } else if (commandName === 'setcoin') {
    // Handle the /setcoin command (Admin Only)
    const isAdmin = interaction.member && interaction.member.permissions.has('ADMINISTRATOR');
    if (!isAdmin) {
      await interaction.reply('You do not have permission to use this command.', { ephemeral: true });
      return;
    }

    const member = options.getMember('member');
    const amount = options.getInteger('amount');

    // Give coins to the member
    userCoins[member.id] = amount;

    await interaction.reply(`Gave ${member.displayName} ${amount} coins.`);
  } else if (commandName === 'coincheck') {
    // Handle the /coincheck command (Available to everyone)
    const userCoinsBalance = userCoins[user.id] || 0;

    await interaction.reply(`You have ${userCoinsBalance} coins.`);
  }
});

// Register slash commands
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    const commands = [
      new SlashCommandBuilder()
        .setName('setitem')
        .setDescription('Set an item for sale (Admin Only)')
        .addStringOption((option) =>
          option
            .setName('itemname')
            .setDescription('Name of the item')
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('itemtype')
            .setDescription('Type of the item')
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('itemcode')
            .setDescription('Unique item code')
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName('itemprice')
            .setDescription('Price of the item')
            .setRequired(true),
        ).toJSON(),
      new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Buy an item from the store')
        .addStringOption((option) =>
          option
            .setName('itemcode')
            .setDescription('Item code to purchase')
            .setRequired(true),
        ).toJSON(),
      new SlashCommandBuilder()
        .setName('setcoin')
        .setDescription('Give coins to a member (Admin Only)')
        .addUserOption((option) =>
          option
            .setName('member')
            .setDescription('The member to give coins')
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName('amount')
            .setDescription('The amount of coins to give')
            .setRequired(true),
        ).toJSON(),
      new SlashCommandBuilder()
        .setName('coincheck')
        .setDescription('Check your coin balance')
        .toJSON(),
    ];

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

// Log in to Discord
client.login(token);
