import 'dotenv/config';
import fs from 'fs';
import express from 'express';
import { Client, GatewayIntentBits, Events } from 'discord.js';

// 🔹 Express 웹 서버 (Render 포트 바인딩)
const app = express();
app.get('/', (req, res) => {
  res.send('봇이 작동 중입니다 🚀');
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 웹 서버가 ${PORT}번 포트에서 실행 중`);
});

// 🔹 디스코드 봇 설정 (인텐트 보강)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,           // 서버 관련 이벤트
    GatewayIntentBits.GuildMembers,     // 멤버 입장/퇴장 이벤트
    GatewayIntentBits.GuildMessages,    // 메시지 이벤트
    GatewayIntentBits.MessageContent    // 메시지 내용 접근
  ]
});

const userJoinCounts = {};
loadData();

client.once(Events.ClientReady, c => {
  console.log(`🤖 Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong! 🏓');
  }

  if (interaction.commandName === 'say') {
    const text = interaction.options.getString('text', true);
    await interaction.reply(text);
  }

  if (interaction.commandName === 'count') {
    const userId = interaction.user.id;
    const count = userJoinCounts[userId] || 0;
    await interaction.reply(`👋 ${interaction.user.username}님은 지금까지 ${count}번 들어오셨어요.`);
  }

  if (interaction.commandName === 'list') {
    if (Object.keys(userJoinCounts).length === 0) {
      await interaction.reply('아직 입장한 유저가 없습니다.');
      return;
    }

    let message = '📋 유저 입장 목록:\n';
    for (const [userId, count] of Object.entries(userJoinCounts)) {
      message += `• <@${userId}> — ${count}번\n`;
    }

    await interaction.reply(message);
  }
});

client.on(Events.GuildMemberAdd, member => {
  const userId = member.user.id;
  if (userJoinCounts[userId]) {
    userJoinCounts[userId]++;
  } else {
    userJoinCounts[userId] = 1;
  }
  saveData();
  console.log(`🆕 ${userId} 입장 횟수: ${userJoinCounts[userId]}`);
});

// 🔹 환경변수 TOKEN으로 로그인
client.login(process.env.TOKEN);

// 🔹 데이터 저장/불러오기
function saveData() {
  fs.writeFileSync('userData.json', JSON.stringify(userJoinCounts, null, 2));
}

function loadData() {
  try {
    const raw = fs.readFileSync('userData.json');
    Object.assign(userJoinCounts, JSON.parse(raw));
    console.log('📂 기존 데이터 불러오기 완료');
  } catch (err) {
    console.log('📂 기존 데이터 없음. 새로 시작합니다.');
  }
}
