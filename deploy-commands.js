import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Pong!'),
  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Echo your text')
    .addStringOption(option =>
      option.setName('text')
        .setDescription('What to say')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('count')
    .setDescription('내 입장 횟수를 확인합니다'),
  new SlashCommandBuilder()
    .setName('list')
    .setDescription('서버에 들어온 유저 목록과 횟수를 보여줍니다') // ✅ 새 명령 추가!
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

try {
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
  console.log('✅ 슬래시 명령 등록 완료');
} catch (err) {
  console.error(err);
}