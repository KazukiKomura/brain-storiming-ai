// バックエンドAPIのベースURL - Docker環境対応版
// Next.jsのrewrites()で設定したプロキシパスを使用
const API_BASE_URL = '/api';

// 付箋（ノート）API
export const notesApi = {
  // 全ての付箋を取得
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/notes`);
    if (!response.ok) {
      throw new Error('Failed to fetch notes');
    }
    return response.json();
  },

  // 付箋を作成
  create: async (noteData: { content: string; position: { x: number; y: number }; color: string; userId?: string }) => {
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });
    if (!response.ok) {
      throw new Error('Failed to create note');
    }
    return response.json();
  },

  // 付箋を更新
  update: async (id: string, updates: any) => {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update note');
    }
    return response.json();
  },

  // 付箋を削除
  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete note');
    }
    return;
  },

  // キャンバスをクリア
  clearAll: async () => {
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to clear notes');
    }
    return;
  },

  // AIによる付箋生成
  generateAINotes: async (topic: string, count: number = 2, existingNotes: any[] = []) => {
    const response = await fetch(`${API_BASE_URL}/notes/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, count, existingNotes }),
    });
    if (!response.ok) {
      throw new Error('Failed to generate AI notes');
    }
    return response.json();
  },

  // ユーザーの付箋内容を保存
  saveNoteContent: async (id: string, content: string | undefined, gridPosition?: { row: number; col: number }, allNotes?: any[], creator?: 'ai' | 'user') => {
    const response = await fetch(`${API_BASE_URL}/notes/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, content, gridPosition, allNotes, creator }),
    });
    if (!response.ok) {
      throw new Error('Failed to save note content');
    }
    return response.json();
  },

  // 保存された付箋を取得 (デバッグ用)
  getSavedNotes: async () => {
    const response = await fetch(`${API_BASE_URL}/notes/saved`);
    if (!response.ok) {
      throw new Error('Failed to get saved notes');
    }
    return response.json();
  },

  // AIによる付箋整理
  organizeNotesByAI: async () => {
    const response = await fetch(`${API_BASE_URL}/notes/ai/organize`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to organize notes by AI');
    }
    return response.json();
  },

  // グリッド状態を取得
  getGridState: async () => {
    const response = await fetch(`${API_BASE_URL}/notes/grid`);
    if (!response.ok) {
      throw new Error('Failed to get grid state');
    }
    return response.json();
  },
};

// ユーザーAPI
export const usersApi = {
  // ユーザーを作成
  create: async (userData: { name?: string }) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error('Failed to create user');
    }
    return response.json();
  },

  // ユーザーをIDで取得
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  },
};

// ゲームAPI
export const gamesApi = {
  // ゲームを作成
  create: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
      throw new Error('Failed to create game');
    }
    return response.json();
  },

  // ゲームをIDで取得
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/games/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch game');
    }
    return response.json();
  },

  // ユーザーIDでゲームを取得
  getByUserId: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/games/user/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch game by user ID');
    }
    return response.json();
  },

  // トピックを選択
  selectTopic: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/games/${id}/select-topic`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to select topic');
    }
    return response.json();
  },

  // ユーザーターンを終了
  endUserTurn: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/games/${id}/end-user-turn`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to end user turn');
    }
    return response.json();
  },

  // ゲームを終了
  endGame: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/games/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to end game');
    }
    return;
  },
}; 