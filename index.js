import 'dotenv/config';
import fs from 'fs';
import express from 'express';
import { Client, GatewayIntentBits, Events } from 'discord.js';

const TARGET_CHANNEL = "1167693030925545523"; // ← 이거만 바꾸면 됨

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

// ======================
// 📌 봇 로그인 후 실행
// ======================
client.once(Events.ClientReady, async c => {
  console.log(`🤖 Logged in as ${c.user.tag}`);

  await scanOldMessages(); // 🔥 기존 메시지 스캔
  console.log("📌 이전 메시지 분석 완료");

});


// ======================
// 📌 메시지 감지 (새 메시지)
// ======================
client.on(Events.MessageCreate, async message => {
  if (message.channel.id !== TARGET_CHANNEL) return; // 특정 채널만 감지
  if (message.author.bot) return; // 봇 제외

  // 멘션된 유저가 있으면 기록
  if (message.mentions.users.size > 0) {
    message.mentions.users.forEach(user => {
      userJoinCounts[user.id] = (userJoinCounts[user.id] || 0) + 1;
    });

    saveData();
    console.log(`📌 새 메시지 기록 업데이트됨`);
  }
});


// ======================
// 📌 이전 메시지 스캔 함수
// ======================
async function scanOldMessages() {
  try {
    const channel = await client.channels.fetch(TARGET_CHANNEL);

    if (!channel || !channel.isTextBased()) {
      return console.log("❌ 채널을 찾을 수 없거나 텍스트 채널 아님");
    }

    console.log("📂 과거 메시지 분석 중...");

    let lastMessageId = null;
    let scanned = 0;

    while (true) {
      const messages = await channel.messages.fetch({
        limit: 100,
        ...(lastMessageId && { before: lastMessageId })
      });

      if (messages.size === 0) break;

      messages.forEach(msg => {
        if (msg.author.bot) return;

        if (msg.mentions.users.size > 0) {
          msg.mentions.users.forEach(user => {
            userJoinCounts[user.id] = (userJoinCounts[user.id] || 0) + 1;
          });
        }
      });

      scanned += messages.size;
      lastMessageId = messages.last().id;

      if (scanned >= 2000) break; // ⛔ 원하는 만큼 조정 가능
    }

    saveData();
    console.log(`✅ 이전 메시지 ${scanned}개 스캔 완료`);

  } catch (err) {
    console.error("❌ 이전 메시지 불러오기 실패:", err);
  }
}


// ======================
// 📌 데이터 저장 / 불러오기
// ======================
function saveData() {
  fs.writeFileSync('userData.json', JSON.stringify(userJoinCounts, null, 2));
}

function loadData() {
  try {
    Object.assign(userJoinCounts, JSON.parse(fs.readFileSync('userData.json')));
    console.log("📂 기존 데이터 불러오기 완료");
  } catch {
    console.log("📂 데이터 없음 → 새로 생성");
  }
}


// ======================
// 📌 서버 + 로그인
// ======================
const app = express();
app.get('/', (req, res) => res.send("봇 작동중 🚀"));

app.listen(process.env.PORT || 3000, async () => {
  console.log(`🌐 서버 실행`);
  await client.login(process.env.TOKEN);
});


