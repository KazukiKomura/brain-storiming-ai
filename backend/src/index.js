const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// CORSの設定 - Docker環境に対応
app.use(cors({
  origin: '*', // すべてのオリジンを許可
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// 保存されたノート
let savedNotes = [];

// セッション管理
let sessions = [];

// ルート
app.get('/', (req, res) => {
  res.send('Brainstorming AI Backend API');
});

// AI付箋生成API
app.post('/api/notes/ai/generate', (req, res) => {
  try {
    const { topic, count = 2, existingNotes = [] } = req.body;
    
    console.log(`AIが「${topic}」に関する付箋を${count}個生成しようとしています`);
    console.log(`現在のキャンバスには${existingNotes.length}個の付箋があります`);
    
    // 仮実装: ダミーデータを返す
    const dummyAIGeneratedNotes = [];
    
    // 既存の付箋の内容を分析（仮実装：単に数をカウント）
    const contentCategories = {
      技術: 0,
      ビジネス: 0,
      社会: 0,
      その他: 0
    };
    
    // 既存の付箋のカテゴリをカウント
    existingNotes.forEach(note => {
      const content = note.content.toLowerCase();
      if (content.includes('技術') || content.includes('tech')) {
        contentCategories.技術++;
      } else if (content.includes('ビジネス') || content.includes('business')) {
        contentCategories.ビジネス++;
      } else if (content.includes('社会') || content.includes('society')) {
        contentCategories.社会++;
      } else {
        contentCategories.その他++;
      }
    });
    
    console.log('付箋カテゴリ分析:', contentCategories);
    
    // カテゴリバランスに基づいて新しい付箋を生成
    // 少ないカテゴリの付箋を優先的に生成（仮実装）
    const sortedCategories = Object.entries(contentCategories)
      .sort((a, b) => a[1] - b[1])
      .map(entry => entry[0]);
    
    // 既存の付箋の位置を追跡
    const occupiedPositions = new Set();
    existingNotes.forEach(note => {
      if (note.gridPosition) {
        const posKey = `${note.gridPosition.row}-${note.gridPosition.col}`;
        occupiedPositions.add(posKey);
      }
    });
    
    console.log('使用済み位置:', Array.from(occupiedPositions));
    
    // 未使用の位置を見つける関数
    const findUnoccupiedPosition = () => {
      // グリッドの範囲（例: 10x10グリッド）
      const gridSize = 10;
      // ランダムな位置を試行
      for (let attempts = 0; attempts < 100; attempts++) {
        const row = Math.floor(Math.random() * gridSize);
        const col = Math.floor(Math.random() * gridSize);
        const posKey = `${row}-${col}`;
        
        if (!occupiedPositions.has(posKey)) {
          occupiedPositions.add(posKey); // 使用済みとしてマーク
          return { row, col };
        }
      }
      
      // ランダム試行で見つからない場合は順番に空きを探す
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const posKey = `${row}-${col}`;
          if (!occupiedPositions.has(posKey)) {
            occupiedPositions.add(posKey); // 使用済みとしてマーク
            return { row, col };
          }
        }
      }
      
      // それでも見つからない場合（グリッドがいっぱい）
      return { row: 0, col: 0 }; // デフォルト位置（重複する可能性あり）
    };
    
    for (let i = 0; i < count; i++) {
      // 少ないカテゴリから優先的に生成
      const category = sortedCategories[i % sortedCategories.length];
      let content = '';
      let color = '';
      
      // カテゴリに応じた内容と色を設定
      switch (category) {
        case '技術':
          content = `${topic}における新技術の活用方法 ${i+1}`;
          color = 'blue';
          break;
        case 'ビジネス':
          content = `${topic}に関するビジネスモデル案 ${i+1}`;
          color = 'green';
          break;
        case '社会':
          content = `${topic}がもたらす社会的影響 ${i+1}`;
          color = 'yellow';
          break;
        default:
          content = `${topic}に関するその他のアイデア ${i+1}`;
          color = 'purple';
      }
      
      // 未使用の位置を見つける
      const gridPosition = findUnoccupiedPosition();
      
      dummyAIGeneratedNotes.push({
        id: `ai-${Date.now()}-${i}`,
        content,
        color,
        gridPosition, // 位置情報を付加
        creator: 'ai'
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
    const { id, content, gridPosition, allNotes, creator } = req.body;
    
    // デバッグログ追加 - 受信したリクエストの中身を確認
    console.log('受信したリクエスト内容:', {
      id,
      contentLength: content ? content.length : 0,
      hasGridPosition: !!gridPosition,
      hasAllNotes: !!allNotes,
      allNotesType: allNotes ? typeof allNotes : 'undefined',
      isAllNotesArray: Array.isArray(allNotes),
      allNotesLength: allNotes && Array.isArray(allNotes) ? allNotes.length : 0,
      creator
    });
    
    if (!id || content === undefined) {
      return res.status(400).json({
        success: false,
        message: 'IDとコンテンツが必要です'
      });
    }
    
    // グリッド位置情報のログ出力
    const gridInfo = gridPosition ? `行: ${gridPosition.row}, 列: ${gridPosition.col}` : '位置情報なし';
    
    // 保存処理 (仮実装: コンソールに出力するだけ)
    console.log(`付箋が保存されました - ID: ${id}, 内容: ${content}, グリッド位置: ${gridInfo}, 作成者: ${creator || '不明'}`);
    
    // 全ての付箋情報が提供された場合はそちらを使用
    if (allNotes && Array.isArray(allNotes)) {
      console.log(`全ての付箋情報が一緒に保存されました (${allNotes.length}個)`);
      // 全ての付箋情報で置き換え
      savedNotes = allNotes;
    } else {
      // 従来の単一付箋保存処理
      const existingNoteIndex = savedNotes.findIndex(note => note.id === id);
      
      if (existingNoteIndex >= 0) {
        savedNotes[existingNoteIndex].content = content;
        if (gridPosition) {
          savedNotes[existingNoteIndex].gridPosition = gridPosition;
        }
        // 作成者情報が指定されていれば更新
        if (creator) {
          savedNotes[existingNoteIndex].creator = creator;
        }
      } else {
        const newNote = { id, content, creator: creator || 'user' };
        if (gridPosition) {
          newNote.gridPosition = gridPosition;
        }
        savedNotes.push(newNote);
      }
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

// セッションID生成API
app.post('/api/sessions/create', (req, res) => {
  try {
    const sessionId = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const simpleId = Math.floor(10000 + Math.random() * 90000).toString(); // 5桁の数字
    
    const newSession = {
      id: sessionId,
      simpleId,
      createdAt: new Date(),
      testData: null,
      sessionData1: null,
      sessionData2: null,
      completed: false
    };
    
    sessions.push(newSession);
    
    console.log(`新しいセッションが作成されました - ID: ${sessionId}, SimpleID: ${simpleId}`);
    
    res.json({
      success: true,
      sessionId,
      simpleId
    });
  } catch (error) {
    console.error('セッション作成エラー:', error);
    res.status(500).json({
      success: false,
      message: 'セッションの作成に失敗しました'
    });
  }
});

// セッションデータ保存API
app.post('/api/sessions/:sessionId/save', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { type, notes } = req.body;
    
    if (!sessionId || !type || !notes) {
      return res.status(400).json({
        success: false,
        message: 'セッションID、タイプ、ノートデータが必要です'
      });
    }
    
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: '指定されたセッションが見つかりません'
      });
    }
    
    // セッションタイプに応じてデータを保存
    switch (type) {
      case 'test':
        session.testData = notes;
        break;
      case 'session1':
        session.sessionData1 = notes;
        break;
      case 'session2':
        session.sessionData2 = notes;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '無効なセッションタイプ'
        });
    }
    
    console.log(`セッションデータが保存されました - ID: ${sessionId}, タイプ: ${type}, ノート数: ${notes.length}`);
    
    res.json({
      success: true,
      message: 'セッションデータが保存されました'
    });
  } catch (error) {
    console.error('セッションデータ保存エラー:', error);
    res.status(500).json({
      success: false,
      message: 'セッションデータの保存に失敗しました'
    });
  }
});

// セッション完了API
app.post('/api/sessions/:sessionId/complete', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: '指定されたセッションが見つかりません'
      });
    }
    
    session.completed = true;
    
    console.log(`セッションが完了しました - ID: ${sessionId}, SimpleID: ${session.simpleId}`);
    
    res.json({
      success: true,
      simpleId: session.simpleId
    });
  } catch (error) {
    console.error('セッション完了エラー:', error);
    res.status(500).json({
      success: false,
      message: 'セッション完了の処理に失敗しました'
    });
  }
});

// セッション情報取得API
app.get('/api/sessions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: '指定されたセッションが見つかりません'
      });
    }
    
    res.json({
      success: true,
      session: {
        id: session.id,
        simpleId: session.simpleId,
        createdAt: session.createdAt,
        hasTestData: !!session.testData,
        hasSessionData1: !!session.sessionData1,
        hasSessionData2: !!session.sessionData2,
        completed: session.completed
      }
    });
  } catch (error) {
    console.error('セッション情報取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'セッション情報の取得に失敗しました'
    });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーが http://localhost:${PORT} で起動しました`);
});