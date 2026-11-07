import express from 'express';
import { WebcastPushConnection } from 'tiktok-live-connector';
import cors from 'cors';

const app = express();
app.use(cors());

// Quản lý các client đang kết nối (Frontend)
let sseClients: any[] = [];

function sendSSE(type: string, data: any) {
  sseClients.forEach(client => {
    client.res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  });
}

// Endpoint SSE cho Frontend lắng nghe
app.get('/api/tiktok/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  sseClients.push({ req, res });
  req.on('close', () => {
    sseClients = sseClients.filter(client => client.req !== req);
  });
});

// CẤU HÌNH KÊNH TIKTOK TẠI ĐÂY
const tiktokUsername = 'dien_ten_kenh_tiktok_cua_ban'; 
const tiktokLiveConnection = new WebcastPushConnection(tiktokUsername);

tiktokLiveConnection.connect().then(state => {
  console.info(`✅ Đã kết nối phòng LIVE: ${state.roomId}`);
  sendSSE('status', { connected: true, channelName: tiktokUsername });
}).catch(err => {
  console.error('❌ Lỗi kết nối TikTok:', err);
});

// 1. LẮNG NGHE CHAT VÀ LỆNH "VÀO LỚP"
tiktokLiveConnection.on('chat', data => {
  const msg = data.comment.trim().toLowerCase();
  
  if (msg === 'vào lớp' || msg.startsWith('tổ')) {
    let group = Math.floor(Math.random() * 4) + 1;
    if (msg.includes('tổ 1')) group = 1;
    else if (msg.includes('tổ 2')) group = 2;
    else if (msg.includes('tổ 3')) group = 3;
    else if (msg.includes('tổ 4')) group = 4;

    sendSSE('joinClass', {
      uniqueId: data.uniqueId,
      nickname: data.nickname,
      avatar: data.profilePictureUrl,
      group: group
    });
  } else {
    sendSSE('chat', { uniqueId: data.uniqueId, nickname: data.nickname, comment: data.comment });
  }
});

// 2. LẮNG NGHE LƯỢT THẢ TIM (LIKE)
tiktokLiveConnection.on('like', data => {
  sendSSE('like', { totalLikes: data.totalLikeCount, addLikes: data.likeCount });
});

// 3. LẮNG NGHE TẶNG QUÀ (GIFT)
tiktokLiveConnection.on('gift', data => {
  // Chỉ ghi nhận khi combo quà đã tặng xong
  if (data.giftType === 1 && !data.repeatEnd) return; 
  sendSSE('gift', {
    nickname: data.nickname,
    giftName: data.giftName,
    diamondCount: data.diamondCount,
    repeatCount: data.repeatCount
  });
});

// Khởi chạy server API (cổng 3006 mặc định của dự án)
const PORT = process.env.PORT || 3006;
app.listen(PORT, () => console.log(`🚀 Server TikTok chạy tại port ${PORT}`));