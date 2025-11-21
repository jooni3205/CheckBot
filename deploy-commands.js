import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

// -----------------------------
// 슬래시 명령 정의
// -----------------------------
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
    .setDescription('서버에 들어온 유저 목록과 횟수를 보여줍니다'),
  new SlashCommandBuilder()
    .setName('addcount')
    .setDescription('지정한 유저의 입장 횟수를 1회 증가시킵니다')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('입장 횟수를 증가시킬 유저')
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

// -----------------------------
// REST 객체 생성
// -----------------------------
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// -----------------------------
// 슬래시 명령 등록
// -----------------------------
(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ 슬래시 명령 등록 완료');
  } catch (err) {
    console.error('❌ 슬래시 명령 등록 실패:', err);
  }
})();
