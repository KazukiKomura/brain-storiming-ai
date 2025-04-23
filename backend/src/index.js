const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// ミドルウェア
app.use(cors());
app.use(bodyParser.json());

// 保存されたノート
let savedNotes = [];

// ルート
app.get('/', (req, res) => {
  res.send('Brainstorming AI Backend API');
});

// AI付箋生成API
app.post('/api/notes/ai/generate', (req, res) => {
  try {
    const { topic, count = 2 } = req.body;
    
    console.log(`AIが「${topic}」に関する付箋を${count}個生成しようとしています`);
    
    // 仮実装: ダミーデータを返す
    const dummyAIGeneratedNotes = [];
    
    for (let i = 0; i < count; i++) {
      dummyAIGeneratedNotes.push({
        id: `ai-${Date.now()}-${i}`,
        content: `${topic}に関するAIのアイデア ${i+1}`,
        color: ['yellow', 'green', 'blue', 'purple'][Math.floor(Math.random() * 4)]
      });
    }
    
    console.log('AI生成付箋:', dummyAIGeneratedNotes);
    
    res.json({
      success: true,
      notes: dummyAIGeneratedNotes
    });
  } catch (error) {
    console.error('AI付箋生成エラー:', error);
    res.status(500).json({
      success: false,
      message: 'AI付箋の生成に失敗しました'
    });
  }
});

// ユーザーの付箋内容保存API
app.post('/api/notes/save', (req, res) => {
  try {
    const { id, content } = req.body;
    
    if (!id || !content) {
      return res.status(400).json({
        success: false,
        message: 'IDとコンテンツが必要です'
      });
    }
    
    // 保存処理 (仮実装: コンソールに出力するだけ)
    console.log(`付箋が保存されました - ID: ${id}, 内容: ${content}`);
    
    // 保存されたノートに追加
    const existingNoteIndex = savedNotes.findIndex(note => note.id === id);
    
    if (existingNoteIndex >= 0) {
      savedNotes[existingNoteIndex].content = content;
    } else {
      savedNotes.push({ id, content });
    }
    
    res.json({
      success: true,
      message: '付箋が保存されました'
    });
  } catch (error) {
    console.error('付箋保存エラー:', error);
    res.status(500).json({
      success: false,
      message: '付箋の保存に失敗しました'
    });
  }
});

// 保存された付箋を取得するAPI (デバッグ用)
app.get('/api/notes/saved', (req, res) => {
  res.json({
    success: true,
    notes: savedNotes
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーが http://localhost:${PORT} で起動しました`);
}); 