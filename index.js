import 'dotenv/config';
import fs from 'fs';
import express from 'express';
import { Client, GatewayIntentBits, Events } from 'discord.js';

// 🔹 디스코드 봇 설정
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🔹 유저 입장 횟수 저장
const userJoinCounts = {};
loadData();

// 🔹 봇 준비 완료
client.once(Events.ClientReady, async c => {
  console.log(`🤖 Logged in as ${c.user.tag}`);

  // 🔹 기존 서버 멤버 기록 (이미 서버에 있는 사람들)
  for (const guild of client.guilds.cache.values()) {
    try {
      const members = await guild.members.fetch(); // 서버 멤버 전체 가져오기
      members.forEach(member => {
        const userId = member.user.id;
        if (!userJoinCounts[userId]) {
          userJoinCounts[userId] = 1; // 기존 멤버는 1번 입장으로 기록
        }
      });
      saveData();
      console.log(`📂 ${guild.name} 서버 기존 멤버 기록 완료`);
    } catch (err) {
      console.error(`❌ ${guild.name} 서버 멤버 가져오기 실패:`, err);
    }
  }
});

// 🔹 슬래시 명령어 처리 + 로그
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    // ✅ Interaction 먼저 defer
    await interaction.deferReply();

    // 🔹 명령 로그 출력
    const options = interaction.options.data
      .map(opt => `${opt.name}=${opt.value}`)
      .join(', ');
    console.log(`[COMMAND] ${interaction.user.tag} ran /${interaction.commandName}${options ? ' (' + options + ')' : ''}`);

    // 🔹 명령 처리
    switch (interaction.commandName) {
      case 'ping':
        await interaction.editReply('Pong! 🏓');
        break;

      case 'say':
        const text = interaction.options.getString('text', true);
        await interaction.editReply(text);
        break;

      case 'count':
        const userId = interaction.user.id;
        const count = userJoinCounts[userId] || 0;
        await interaction.editReply(`👋 ${interaction.user.username}님은 지금까지 ${count}번 들어오셨어요.`);
        break;

      case 'list':
        if (Object.keys(userJoinCounts).length === 0) {
          await interaction.editReply('아직 입장한 유저가 없습니다.');
        } else {
          let message = '📋 유저 입장 목록:\n';
          for (const [userId, count] of Object.entries(userJoinCounts)) {
            message += `• <@${userId}> — ${count}번\n`;
          }
          await interaction.editReply(message);
        }
        break;

      default:
        await interaction.editReply('❓ 알 수 없는 명령어입니다.');
    }

  } catch (err) {
    console.error('❌ Interaction 처리 중 오류:', err);
  }
});

// 🔹 새 유저 입장 감지
client.on(Events.GuildMemberAdd, async member => {
  const userId = member.user.id;

  userJoinCounts[userId] = (userJoinCounts[userId] || 0) + 1;
  saveData();

  console.log(`🆕 ${userId} 입장 횟수: ${userJoinCounts[userId]}`);

  if (userJoinCounts[userId] >= 3) {
    const channelId = '1441087159191998569'; // 원하는 채널 ID
    try {
      const channel = await member.guild.channels.fetch(channelId);
      if (channel && channel.isTextBased()) {
        await channel.send(`🚨 <@${userId}>님이 ${userJoinCounts[userId]}번째로 서버에 들어왔습니다!`);
      } else {
        console.log('❌ 알림 채널을 찾을 수 없거나 텍스트 채널이 아닙니다.');
      }
    } catch (err) {
      console.error('❌ 채널 가져오기 오류:', err);
    }
  }
});

// 🔹 Express 웹 서버 + 봇 로그인
const app = express();
app.get('/', (req, res) => {
  res.send('봇이 작동 중입니다 🚀');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🌐 웹 서버가 ${PORT}번 포트에서 실행 중`);
  console.log("TOKEN 상태:", process.env.TOKEN ? "OK" : "MISSING");

  try {
    await client.login(process.env.TOKEN);
  } catch (err) {
    console.error("❌ 로그인 실패:", err);
  }
});

// 🔁 Self-ping 기능 (30초마다)
const SELF_URL = 'https://checkbot-q0dd.onrender.com';
setInterval(() => {
  fetch(SELF_URL)
    .then(() => console.log('🔁 Self-ping 성공'))
    .catch(err => console.error('❌ Self-ping 실패:', err));
}, 30000);

// 🔹 데이터 저장/불러오기
function saveData() {
  fs.writeFileSync('userData.json', JSON.stringify(userJoinCounts, null, 2));
}

function loadData() {
  try {
    const raw = fs.readFileSync('userData.json');
    Object.assign(userJoinCounts, JSON.parse(raw));
    console.log('📂 기존 데이터 불러오기 완료');
  } catch {
    console.log('📂 기존 데이터 없음. 새로 시작합니다.');
  }
}
