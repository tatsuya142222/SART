// テスト時は true、本番時は false に変更してください
const TEST_MODE = true;

export const EXPERIMENT_CONFIG = {
  STIMULUS_DURATION: 250,
  MASK_DURATION: 900,
  FIXATION_DURATION: 500,
  TARGET_DIGIT: 3,
  FONT_SIZES: [48, 72, 94, 100, 120],
  PRACTICE_TRIALS:        TEST_MODE ? 6   : 18,
  PRACTICE_TARGETS:       TEST_MODE ? 1   : 2,
  TEST_TRIALS_PER_BLOCK:  TEST_MODE ? 9   : 522,
  TARGETS_PER_BLOCK:      TEST_MODE ? 1   : 58,
  NUM_BLOCKS:             TEST_MODE ? 1   : 3,
  BREAK_DURATION_SECONDS: TEST_MODE ? 5   : 300,

  // ゲーミフィケーション（条件B）
  POINTS_PER_CORRECT: 10,
  RT_FAST_THRESHOLD: 400,
  RT_SLOW_THRESHOLD: 700,
} as const;

export const IMI_ITEMS = [
  { code: 'IMI_01', text: 'この課題はとても楽しかった', reversed: false },
  { code: 'IMI_02', text: 'この課題はつまらなかった', reversed: true },
  { code: 'IMI_03', text: 'この課題はとても面白かった', reversed: false },
  { code: 'IMI_04', text: 'この課題は楽しめなかった', reversed: true },
  { code: 'IMI_05', text: 'この課題に取り組むことは楽しかった', reversed: false },
  { code: 'IMI_06', text: 'この課題をやることが好きだった', reversed: false },
  { code: 'IMI_07', text: 'この課題に従事している間、退屈だった', reversed: true },
] as const;

export const NASA_TLX_ITEMS = [
  {
    code: 'MENTAL',
    label: '精神的要求',
    description: '考える・判断する・計算するなど、精神的・知覚的な作業はどれくらいありましたか？',
    low_label: '低い',
    high_label: '高い',
  },
  {
    code: 'PHYSICAL',
    label: '身体的要求',
    description: '押す・引く・回すなど、身体的な作業はどれくらいありましたか？',
    low_label: '低い',
    high_label: '高い',
  },
  {
    code: 'TEMPORAL',
    label: '時間的プレッシャー',
    description: '課題のペースや速さによるプレッシャーはどれくらいありましたか？',
    low_label: '低い',
    high_label: '高い',
  },
  {
    code: 'PERFORMANCE',
    label: '作業達成度',
    description: '課題の目標をどれくらい達成できましたか？',
    low_label: '完璧',
    high_label: '失敗',
  },
  {
    code: 'EFFORT',
    label: '努力',
    description: '課題を達成するために、どれくらい努力しましたか？',
    low_label: '低い',
    high_label: '高い',
  },
  {
    code: 'FRUSTRATION',
    label: '欲求不満',
    description: '課題中、不安・焦り・いらだち・ストレスはどれくらいありましたか？',
    low_label: '低い',
    high_label: '高い',
  },
] as const;
