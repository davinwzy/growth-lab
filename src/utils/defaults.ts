import type { ScoreItem, Reward } from '../types';

// Default score items (预设加减分项目)
export const defaultScoreItems: ScoreItem[] = [
  // Classroom performance (课堂表现类)
  { id: 'default-1', name: '积极发言', nameEn: 'Active Participation', value: 1, category: 'classroom', isDefault: true },
  { id: 'default-2', name: '上课认真', nameEn: 'Attentive in Class', value: 1, category: 'classroom', isDefault: true },
  { id: 'default-3', name: '迟到', nameEn: 'Late Arrival', value: -1, category: 'classroom', isDefault: true },
  { id: 'default-4', name: '说话', nameEn: 'Talking in Class', value: -1, category: 'classroom', isDefault: true },

  // Academic (学习成果类)
  { id: 'default-5', name: '测验满分', nameEn: 'Perfect Quiz Score', value: 3, category: 'academic', isDefault: true },
  { id: 'default-6', name: '作业优秀', nameEn: 'Excellent Homework', value: 2, category: 'academic', isDefault: true },
  { id: 'default-7', name: '进步奖励', nameEn: 'Improvement Award', value: 2, category: 'academic', isDefault: true },
  { id: 'default-8', name: '没做作业', nameEn: 'Missing Homework', value: -2, category: 'academic', isDefault: true },

  // Behavior (行为习惯类)
  { id: 'default-9', name: '助人为乐', nameEn: 'Helping Others', value: 2, category: 'behavior', isDefault: true },
  { id: 'default-10', name: '班级贡献', nameEn: 'Class Contribution', value: 3, category: 'behavior', isDefault: true },
  { id: 'default-11', name: '违反纪律', nameEn: 'Discipline Violation', value: -2, category: 'behavior', isDefault: true },
];

// Default rewards (预设礼物) — 按等级分类, Low Budget
export const defaultRewards: Reward[] = [
  // 🌱 Lv.1 新手 (Novice) — 无门槛
  { id: 'reward-1', name: '贴纸/印章', nameEn: 'Sticker / Stamp', cost: 10, description: '一张贴纸或盖章奖励', descriptionEn: 'A sticker or stamp reward', isDefault: true },
  { id: 'reward-2', name: '老师表扬信', nameEn: 'Teacher Praise Letter', cost: 15, description: '带回家给家长的表扬信', descriptionEn: 'Praise letter to take home to parents', isDefault: true },
  { id: 'reward-3', name: '选座位一天', nameEn: 'Choose Seat for a Day', cost: 15, description: '可选择自己喜欢的座位一天', descriptionEn: 'Pick your preferred seat for one day', isDefault: true },
  { id: 'reward-4', name: '课堂听一首歌', nameEn: 'Play a Song in Class', cost: 20, description: '课堂上播放一首自选歌曲', descriptionEn: 'Play a song of your choice in class', isDefault: true },
  { id: 'reward-5', name: '免一次作业', nameEn: 'Homework Pass', cost: 30, description: '可免除一次作业', descriptionEn: 'Skip one homework assignment', isDefault: true },

  // 📖 Lv.2 学徒 (Apprentice)
  { id: 'reward-6', name: '午休多10分钟券', nameEn: 'Extra 10min Break', cost: 30, description: '午休延长10分钟', descriptionEn: 'Extend lunch break by 10 minutes', isDefault: true, minLevel: 2 },
  { id: 'reward-7', name: '铅笔/橡皮/尺子', nameEn: 'Pencil / Eraser / Ruler', cost: 35, description: '一件文具小奖品', descriptionEn: 'A small stationery prize', isDefault: true, minLevel: 2 },
  { id: 'reward-8', name: '带零食到校一天', nameEn: 'Bring Snacks to School', cost: 40, description: '允许带零食到校一天', descriptionEn: 'Permission to bring snacks for one day', isDefault: true, minLevel: 2 },
  { id: 'reward-9', name: '迟交作业免罚券', nameEn: 'Late Homework Pass', cost: 45, description: '迟交一次作业不扣分', descriptionEn: 'Submit homework late without penalty', isDefault: true, minLevel: 2 },
  { id: 'reward-10', name: '当小老师一节课', nameEn: 'Be the Mini Teacher', cost: 50, description: '在一节课上担任小老师', descriptionEn: 'Be the mini teacher for one class', isDefault: true, minLevel: 2 },

  // ⚔️ Lv.3 战士 (Warrior)
  { id: 'reward-11', name: '笔记本', nameEn: 'Notebook', cost: 70, description: '一本精美笔记本', descriptionEn: 'A nice notebook', isDefault: true, minLevel: 3 },
  { id: 'reward-12', name: '当班长一天', nameEn: 'Class Monitor for a Day', cost: 80, description: '担任一天班长', descriptionEn: 'Be the class monitor for one day', isDefault: true, minLevel: 3 },
  { id: 'reward-13', name: '和朋友换座位一周', nameEn: 'Swap Seats with Friend (1 Week)', cost: 90, description: '和好朋友换座位坐一周', descriptionEn: 'Swap seats with a friend for one week', isDefault: true, minLevel: 3 },
  { id: 'reward-14', name: '课堂电影选片权', nameEn: 'Movie Pick Privilege', cost: 100, description: '电影课时选择播放的影片', descriptionEn: 'Choose the movie for movie class', isDefault: true, minLevel: 3 },
  { id: 'reward-15', name: '免一次小测', nameEn: 'Skip a Quiz', cost: 120, description: '可免除一次小测验', descriptionEn: 'Skip one quiz', isDefault: true, minLevel: 3 },

  // 🛡️ Lv.4 骑士 (Knight)
  { id: 'reward-16', name: '老师请喝饮料', nameEn: 'Teacher Buys a Drink', cost: 150, description: '老师请你喝一杯饮料', descriptionEn: 'Teacher buys you a drink', isDefault: true, minLevel: 4 },
  { id: 'reward-17', name: '文具套装', nameEn: 'Stationery Set', cost: 180, description: '一套精美文具', descriptionEn: 'A nice stationery set', isDefault: true, minLevel: 4 },
  { id: 'reward-18', name: '出一道考试题', nameEn: 'Create an Exam Question', cost: 200, description: '在考试中出一道自己的题目', descriptionEn: 'Create one question for the exam', isDefault: true, minLevel: 4 },
  { id: 'reward-19', name: '当值日班长一周', nameEn: 'Class Monitor for a Week', cost: 200, description: '担任一周值日班长', descriptionEn: 'Be the class monitor for one week', isDefault: true, minLevel: 4 },
  { id: 'reward-20', name: '自由活动课一节', nameEn: 'Free Activity Period', cost: 250, description: '获得一节自由活动课', descriptionEn: 'Earn a free activity period', isDefault: true, minLevel: 4 },

  // 🏆 Lv.5 大师 (Master)
  { id: 'reward-21', name: '书籍/课外读物', nameEn: 'Book / Reading Material', cost: 350, description: '一本自选书籍', descriptionEn: 'A book of your choice', isDefault: true, minLevel: 5 },
  { id: 'reward-22', name: '当一天代课老师', nameEn: 'Substitute Teacher for a Day', cost: 400, description: '在一节课上当代课老师', descriptionEn: 'Be the substitute teacher for a class', isDefault: true, minLevel: 5 },
  { id: 'reward-23', name: '自选奖励（老师审批）', nameEn: 'Custom Reward (Teacher Approved)', cost: 450, description: '提出一个自选奖励，经老师同意后兑换', descriptionEn: 'Propose a custom reward, redeemable upon teacher approval', isDefault: true, minLevel: 5 },
  { id: 'reward-24', name: '免考一次券', nameEn: 'Exam Exemption Pass', cost: 500, description: '可免除一次考试', descriptionEn: 'Skip one exam', isDefault: true, minLevel: 5 },

  // 👑 Lv.6 传说 (Legend)
  { id: 'reward-25', name: '和老师一起午餐', nameEn: 'Lunch with Teacher', cost: 700, description: '和老师一起吃午餐', descriptionEn: 'Have lunch with the teacher', isDefault: true, minLevel: 6 },
  { id: 'reward-26', name: '学期末特别荣誉证书', nameEn: 'Special Honor Certificate', cost: 800, description: '获得学期末特别荣誉证书', descriptionEn: 'Receive a special honor certificate at end of term', isDefault: true, minLevel: 6 },
  { id: 'reward-27', name: '麦当劳套餐', nameEn: 'McDonald\'s Meal', cost: 1000, description: '终极大奖！兑换一份麦当劳套餐', descriptionEn: 'Ultimate reward! Redeem a McDonald\'s meal', isDefault: true, minLevel: 6 },
];

// Default group colors
export const groupColors = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
];
