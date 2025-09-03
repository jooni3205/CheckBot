import 'dotenv/config';
import fs from 'fs';
import express from 'express';
import { Client, GatewayIntentBits, Events } from 'discord.js';

// 🔹 Express 웹 서버 설정
const app = express();
app.get('/', (req, res) => {
  res.send('봇이 작동 중입니다 🚀');
});
app.listen(3000, () => {
  console.log('🌐 웹 서버가 3000번 포트에서 실행 중');
});

// 🔹 디스코드 봇 설정
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const userJoinCounts = {}; // 유저 입장 횟수 저장용
loadData(); // 봇 시작 시 기존 데이터 불러오기

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

// 🔹 새 유저 감지 + 3회 이상이면 특정 채널 알림
client.on(Events.GuildMemberAdd, async member => {
  const userId = member.user.id;

  if (userJoinCounts[userId]) {
    userJoinCounts[userId]++;
  } else {
    userJoinCounts[userId] = 1;
  }

  saveData(); // 변경된 데이터 저장
  console.log(`🆕 ${userId} 입장 횟수: ${userJoinCounts[userId]}`);

  // 3회 이상이면 알림 전송
  if (userJoinCounts[userId] >= 3) {
    const channelId = '1412332644716515425'; // 원하는 채널 ID로 변경
    try {
      const channel = await member.guild.channels.fetch(channelId);
      if (channel && channel.isTextBased()) {
        await channel.send(`🚨 <@${userId}>님이 ${userJoinCounts[userId]}번째로 서버에 들어왔습니다!`);
      } else {
        console.log('❌ 알림 채널을 찾을 수 없거나 텍스트 채널이 아닙니다.');
      }
    } catch (err) {
      console.error('❌ 채널을 가져오는 중 오류 발생:', err);
    }
  }
});

client.login(process.env.TOKEN);

// 파일 저장 함수
function saveData() {
  fs.writeFileSync('userData.json', JSON.stringify(userJoinCounts, null, 2));
}

// 파일 불러오기 함수
function loadData() {
  try {
    const raw = fs.readFileSync('userData.json');
    Object.assign(userJoinCounts, JSON.parse(raw));
    console.log('📂 기존 데이터 불러오기 완료');
  } catch (err) {
    console.log('📂 기존 데이터 없음. 새로 시작합니다.');
  }
}
