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
    .setName('list2')
    .setDescription('입장 횟수가 2번인 유저 목록을 보여줍니다'),
  new SlashCommandBuilder()
    .setName('removecount')
    .setDescription('특정 유저의 입장 횟수를 1 감소시킵니다.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('입장 횟수를 감소시킬 유저')
        .setRequired(true)
    ),
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
// 여러 서버에 슬래시 명령 등록
// -----------------------------
(async () => {
  try {
    const guildIds = process.env.GUILD_ID.split(","); // 쉼표로 분리 (여러 서버 지원)

    for (const id of guildIds) {
      const guildId = id.trim(); // 공백 제거

      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
        { body: commands }
      );

      console.log(`✅ 슬래시 명령 등록 완료 → 서버 ID: ${guildId}`);
    }

    console.log("🎉 모든 서버에 슬래시 명령 등록 완료!");
  } catch (err) {
    console.error('❌ 슬래시 명령 등록 실패:', err);
  }
})();
