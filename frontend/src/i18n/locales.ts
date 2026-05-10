export type Locale = 'zh' | 'en'

export type TranslationKey =
  | 'app.title'
  | 'app.badge'
  | 'app.donate'
  | 'app.scoredCount'
  | 'app.scoring.title'
  | 'app.scoring.subtitle'
  | 'app.scoring.volcengine'
  | 'app.scoring.gemini'
  | 'app.scoring.waiting'
  | 'app.footer'
  | 'app.footerCount'
  | 'app.donateSuccess'
  | 'app.donateCancel'
  | 'tab.upload'
  | 'tab.gallery'
  | 'tab.leaderboard'
  | 'tab.battle'
  | 'upload.heroLabel'
  | 'upload.heroTitle'
  | 'upload.heroDesc'
  | 'upload.dropLabel'
  | 'upload.formatHint'
  | 'upload.uploading'
  | 'upload.uploadingSub'
  | 'upload.errorFormat'
  | 'upload.errorSize'
  | 'upload.judgeGemini'
  | 'upload.judgeVolc'
  | 'gallery.header'
  | 'gallery.title'
  | 'gallery.count'
  | 'gallery.empty'
  | 'gallery.emptySub'
  | 'gallery.aiScore'
  | 'gallery.scoring'
  | 'gallery.delete'
  | 'gallery.review'
  | 'gallery.collapse'
  | 'gallery.expand'
  | 'gallery.rescore'
  | 'leaderboard.title'
  | 'leaderboard.subtitle'
  | 'leaderboard.empty'
  | 'leaderboard.emptySub'
  | 'leaderboard.champion'
  | 'leaderboard.runnerUp'
  | 'leaderboard.thirdPlace'
  | 'leaderboard.challengerCount'
  | 'leaderboard.defendingChamp'
  | 'leaderboard.silverChallenger'
  | 'leaderboard.bronzeChallenger'
  | 'score.rank.masterpiece'
  | 'score.rank.masterpieceSub'
  | 'score.rank.excellent'
  | 'score.rank.excellentSub'
  | 'score.rank.promising'
  | 'score.rank.promisingSub'
  | 'score.rank.intermediate'
  | 'score.rank.intermediateSub'
  | 'score.rank.beginner'
  | 'score.rank.beginnerSub'
  | 'score.title'
  | 'score.viewLeaderboard'
  | 'score.rankPodium1'
  | 'score.rankPodium2'
  | 'score.rankPodium3'
  | 'score.rankTop10'
  | 'score.rankBelow10'
  | 'score.rankTop10Sub'
  | 'score.rankBelow10Sub'
  | 'score.rankCount'
  | 'score.dimensions'
  | 'score.legendary'
  | 'score.legendarySub'
  | 'score.master'
  | 'score.masterSub'
  | 'score.outstanding'
  | 'score.outstandingSub'
  | 'score.risingStar'
  | 'score.risingStarSub'
  | 'score.advancing'
  | 'score.advancingSub'
  | 'score.freshman'
  | 'score.freshmanSub'
  | 'battle.header'
  | 'battle.title'
  | 'battle.subtitle'
  | 'battle.yourPhoto'
  | 'battle.opponent'
  | 'battle.changesLeft'
  | 'battle.noChanges'
  | 'battle.changeOpponent'
  | 'battle.uploadNew'
  | 'battle.uploading'
  | 'battle.uploadingSub'
  | 'battle.dropLabel'
  | 'battle.formatHint'
  | 'battle.noOpponent'
  | 'battle.loadOpponent'
  | 'battle.errorFormat'
  | 'battle.errorSize'
  | 'battle.loadError'
  | 'battle.photographer'
  | 'battle.battleBtn'
  | 'battle.battling'
  | 'battle.noPhoto'
  | 'battle.loadingOpponent'
  | 'battleReveal.title'
  | 'battleReveal.yourLabel'
  | 'battleReveal.opponentLabel'
  | 'battleReveal.win'
  | 'battleReveal.winSub'
  | 'battleReveal.lose'
  | 'battleReveal.loseSub'
  | 'battleReveal.draw'
  | 'battleReveal.drawSub'
  | 'battleReveal.yourReview'
  | 'battleReveal.opponentReview'
  | 'battleReveal.comparison'
  | 'battleReveal.attribution'
  | 'battleReveal.photographerBy'
  | 'battleReveal.fromUnsplash'
  | 'donate.title'
  | 'donate.subtitle'
  | 'donate.custom'
  | 'donate.redirecting'
  | 'donate.confirm'
  | 'donate.footer'
  | 'donate.errorMin'
  | 'donate.errorCreate'

const zh: Record<TranslationKey, string> = {
  'app.title': '摄影大乱斗',
  'app.badge': '竞技场',
  'app.donate': '打赏',
  'app.scoredCount': '张已评分',
  'app.scoring.title': 'AI 评审中',
  'app.scoring.subtitle': '两个 AI 模型正在紧张讨论中...',
  'app.scoring.volcengine': '正在分析美学与构图...',
  'app.scoring.gemini': '正在进行专业摄影点评...',
  'app.scoring.waiting': '审议中...',
  'app.footer': '摄影大乱斗 · AI 摄影评分',
  'app.footerCount': '张照片',
  'app.donateSuccess': '感谢您的支持！❤️',
  'app.donateCancel': '支付已取消，期待您的下次支持',
  'tab.upload': '上传',
  'tab.gallery': '画廊',
  'tab.leaderboard': '排行榜',
  'tab.battle': '1 V 1 挑战',
  'upload.heroLabel': 'AI 摄影评分',
  'upload.heroTitle': '挑战 AI 评审团',
  'upload.heroDesc': '上传你的摄影作品，获得 AI 在构图、光线、色彩等多维度的专业点评与评分。',
  'upload.dropLabel': '拖拽或点击上传',
  'upload.formatHint': 'JPEG 格式 · 最大 30MB',
  'upload.uploading': '正在分析你的作品...',
  'upload.uploadingSub': '两个 AI 模型正在审议，请稍候',
  'upload.errorFormat': '仅支持 JPEG 格式',
  'upload.errorSize': '文件大小超过 30MB 限制',
  'upload.judgeGemini': 'Gemini AI',
  'upload.judgeVolc': 'VolcEngine 美学',
  'gallery.header': '作品集',
  'gallery.title': '画廊',
  'gallery.count': '张作品',
  'gallery.empty': '暂无照片',
  'gallery.emptySub': '上传你的第一张摄影作品',
  'gallery.aiScore': 'AI 点评',
  'gallery.scoring': '评分中...',
  'gallery.delete': '删除照片',
  'gallery.review': 'AI 点评',
  'gallery.collapse': '收起',
  'gallery.expand': '展开完整点评',
  'gallery.rescore': '重新评分',
  'leaderboard.title': '荣耀殿堂',
  'leaderboard.subtitle': '位挑战者为王座而战',
  'leaderboard.empty': '竞技场虚位以待',
  'leaderboard.emptySub': '上传你的作品，让 AI 评审，冲击排行榜',
  'leaderboard.champion': '冠军',
  'leaderboard.runnerUp': '亚军',
  'leaderboard.thirdPlace': '季军',
  'leaderboard.challengerCount': '挑战者',
  'leaderboard.defendingChamp': '卫冕冠军',
  'leaderboard.silverChallenger': '银牌挑战者',
  'leaderboard.bronzeChallenger': '铜牌竞争者',
  'score.rank.masterpiece': '传奇之作',
  'score.rank.masterpieceSub': '堪称传世经典的摄影杰作',
  'score.rank.excellent': '出类拔萃',
  'score.rank.excellentSub': '在竞技场中极具竞争力的作品',
  'score.rank.promising': '潜力新星',
  'score.rank.promisingSub': '展现出了不俗的摄影天赋',
  'score.rank.intermediate': '进阶之路',
  'score.rank.intermediateSub': '正在磨练你的摄影眼',
  'score.rank.beginner': '初入江湖',
  'score.rank.beginnerSub': '多看看大师作品，继续加油',
  'score.title': '评审结果',
  'score.viewLeaderboard': '查看完整排行榜 →',
  'score.rankPodium1': '🏆 恭喜登顶！你的作品称霸竞技场！',
  'score.rankPodium2': '🥈 太棒了！一举夺得亚军宝座！',
  'score.rankPodium3': '🥉 闯进三甲，实力不凡！',
  'score.rankTop10': '激烈竞争！已跻身前十榜单',
  'score.rankBelow10': '摄影之路，始于足下',
  'score.rankTop10Sub': '研究榜上前辈的作品，继续打磨技艺',
  'score.rankBelow10Sub': '每一位大师都曾是初学者，坚持拍摄！',
  'score.rankCount': '名挑战者中排名第',
  'score.dimensions': '详细点评',
  'score.legendary': '传奇之作',
  'score.legendarySub': '堪称传世经典的摄影杰作',
  'score.master': '大师之作',
  'score.masterSub': '出色的摄影功底和艺术表现力',
  'score.outstanding': '出类拔萃',
  'score.outstandingSub': '在竞技场中极具竞争力的作品',
  'score.risingStar': '潜力新星',
  'score.risingStarSub': '展现出了不俗的摄影天赋',
  'score.advancing': '进阶之路',
  'score.advancingSub': '正在磨练你的摄影眼',
  'score.freshman': '初入江湖',
  'score.freshmanSub': '多看看大师作品，继续加油',
  'battle.header': '摄影大乱斗',
  'battle.title': '挑战随机大师',
  'battle.subtitle': '选择你的作品，与 Unsplash 专业摄影师一决高下',
  'battle.yourPhoto': '你的作品',
  'battle.opponent': '随机对手',
  'battle.changesLeft': '剩余',
  'battle.noChanges': '次数已用完',
  'battle.changeOpponent': '更换对手',
  'battle.uploadNew': '上传新作品',
  'battle.uploading': '正在上传...',
  'battle.uploadingSub': '上传完成后将自动评分',
  'battle.dropLabel': '点击或拖拽上传',
  'battle.formatHint': 'JPEG 格式 · 最大 30MB',
  'battle.noOpponent': '尚未选择对手',
  'battle.loadOpponent': '加载对手',
  'battle.errorFormat': '仅支持 JPEG 格式',
  'battle.errorSize': '文件大小超过 30MB 限制',
  'battle.loadError': '加载对手失败，请重试',
  'battle.photographer': '摄影：',
  'battle.battleBtn': '发起挑战',
  'battle.battling': 'AI 评审中...',
  'battle.noPhoto': '请先上传一张照片',
  'battle.loadingOpponent': '正在加载对手...',
  'battleReveal.title': '对决结果',
  'battleReveal.yourLabel': '你的作品',
  'battleReveal.opponentLabel': '专业作品',
  'battleReveal.win': '你赢了！',
  'battleReveal.winSub': '你的作品在这场对决中更胜一筹',
  'battleReveal.lose': '挑战失败',
  'battleReveal.loseSub': '专业摄影师展现了更强的实力',
  'battleReveal.draw': '势均力敌',
  'battleReveal.drawSub': '双方作品难分伯仲',
  'battleReveal.yourReview': '你的作品点评',
  'battleReveal.opponentReview': '对手作品点评',
  'battleReveal.comparison': '综合对比分析',
  'battleReveal.attribution': '对手作品：',
  'battleReveal.photographerBy': '摄影：',
  'battleReveal.fromUnsplash': '来自 Unsplash',
  'donate.title': '支持我们',
  'donate.subtitle': '您的支持将帮助我们持续改进产品体验',
  'donate.custom': '自定义金额',
  'donate.redirecting': '跳转中...',
  'donate.confirm': '确认支持',
  'donate.footer': '由 Stripe 提供安全支付保障 · 支持 Visa / Mastercard / 支付宝',
  'donate.errorMin': '最低支持',
  'donate.errorCreate': '创建支付会话失败，请稍后重试',
}

const en: Record<TranslationKey, string> = {
  'app.title': 'Isnap World',
  'app.badge': 'ARENA',
  'app.donate': 'Donate',
  'app.scoredCount': 'scored',
  'app.scoring.title': 'AI Judging in Progress',
  'app.scoring.subtitle': 'Two AI models are deliberating...',
  'app.scoring.volcengine': 'Analyzing aesthetics & composition...',
  'app.scoring.gemini': 'Evaluating photographic quality...',
  'app.scoring.waiting': 'Deliberating...',
  'app.footer': 'Isnap World · AI Photo Battle Arena',
  'app.footerCount': 'photos',
  'app.donateSuccess': 'Thank you for your support! ❤️',
  'app.donateCancel': 'Payment cancelled. Hope to see you again!',
  'tab.upload': 'Upload',
  'tab.gallery': 'Gallery',
  'tab.leaderboard': 'Leaderboard',
  'tab.battle': '1 V 1 Battle',
  'upload.heroLabel': 'AI Photo Scoring',
  'upload.heroTitle': 'Challenge the AI Panel',
  'upload.heroDesc': 'Upload your photo and get professional AI reviews across composition, lighting, color, and more.',
  'upload.dropLabel': 'Drop or click to upload',
  'upload.formatHint': 'JPEG · Max 30MB',
  'upload.uploading': 'Analyzing your photo...',
  'upload.uploadingSub': 'Two AI models are reviewing, please wait',
  'upload.errorFormat': 'JPEG format only',
  'upload.errorSize': 'File size exceeds 30MB limit',
  'upload.judgeGemini': 'Gemini AI',
  'upload.judgeVolc': 'VolcEngine Aesthetics',
  'gallery.header': 'Portfolio',
  'gallery.title': 'Gallery',
  'gallery.count': 'photos',
  'gallery.empty': 'No photos yet',
  'gallery.emptySub': 'Upload your first photo',
  'gallery.aiScore': 'AI Review',
  'gallery.scoring': 'Scoring...',
  'gallery.delete': 'Delete photo',
  'gallery.review': 'AI Review',
  'gallery.collapse': 'Collapse',
  'gallery.expand': 'Expand full review',
  'gallery.rescore': 'Re-score',
  'leaderboard.title': 'Hall of Fame',
  'leaderboard.subtitle': 'contestants battling for the throne',
  'leaderboard.empty': 'The arena awaits',
  'leaderboard.emptySub': 'Upload your photo, get scored by AI, and climb the ranks',
  'leaderboard.champion': 'Champion',
  'leaderboard.runnerUp': 'Runner-up',
  'leaderboard.thirdPlace': 'Third Place',
  'leaderboard.challengerCount': 'Challengers',
  'leaderboard.defendingChamp': 'Defending Champion',
  'leaderboard.silverChallenger': 'Silver Challenger',
  'leaderboard.bronzeChallenger': 'Bronze Challenger',
  'score.rank.masterpiece': 'Legendary',
  'score.rank.masterpieceSub': 'A timeless photographic masterpiece',
  'score.rank.excellent': 'Outstanding',
  'score.rank.excellentSub': 'A highly competitive work in the arena',
  'score.rank.promising': 'Rising Star',
  'score.rank.promisingSub': 'Showing remarkable photographic talent',
  'score.rank.intermediate': 'On the Rise',
  'score.rank.intermediateSub': 'Sharpening your photographic eye',
  'score.rank.beginner': 'Getting Started',
  'score.rank.beginnerSub': 'Study the masters and keep shooting!',
  'score.title': 'Judgment',
  'score.viewLeaderboard': 'View Full Leaderboard →',
  'score.rankPodium1': '🏆 Congratulations! Your photo rules the arena!',
  'score.rankPodium2': '🥈 Amazing! A stunning runner-up finish!',
  'score.rankPodium3': '🥉 Top 3 — outstanding performance!',
  'score.rankTop10': 'Close competition! You\'re in the top 10',
  'score.rankBelow10': 'Every master was once a beginner',
  'score.rankTop10Sub': 'Study the works above you and keep honing your craft',
  'score.rankBelow10Sub': 'Keep shooting — every master started somewhere!',
  'score.rankCount': 'of',
  'score.dimensions': 'Detailed Review',
  'score.legendary': 'Legendary',
  'score.legendarySub': 'A timeless photographic masterpiece',
  'score.master': 'Masterpiece',
  'score.masterSub': 'Excellent photographic skill and artistic expression',
  'score.outstanding': 'Outstanding',
  'score.outstandingSub': 'A highly competitive work in the arena',
  'score.risingStar': 'Rising Star',
  'score.risingStarSub': 'Showing remarkable photographic talent',
  'score.advancing': 'On the Rise',
  'score.advancingSub': 'Sharpening your photographic eye',
  'score.freshman': 'Getting Started',
  'score.freshmanSub': 'Study the masters and keep shooting!',
  'battle.header': 'Photo Battle',
  'battle.title': 'Challenge a Master',
  'battle.subtitle': 'Pit your photo against professional Unsplash photographers',
  'battle.yourPhoto': 'Your Photo',
  'battle.opponent': 'Random Opponent',
  'battle.changesLeft': 'Left',
  'battle.noChanges': 'No changes left',
  'battle.changeOpponent': 'Change',
  'battle.uploadNew': 'Upload New',
  'battle.uploading': 'Uploading...',
  'battle.uploadingSub': 'Will auto-score after upload',
  'battle.dropLabel': 'Click or drag to upload',
  'battle.formatHint': 'JPEG · Max 30MB',
  'battle.noOpponent': 'No opponent selected',
  'battle.loadOpponent': 'Load opponent',
  'battle.errorFormat': 'JPEG format only',
  'battle.errorSize': 'File size exceeds 30MB limit',
  'battle.loadError': 'Failed to load opponent. Please try again.',
  'battle.photographer': 'Photo by ',
  'battle.battleBtn': 'Start Battle',
  'battle.battling': 'AI Judging...',
  'battle.noPhoto': 'Please upload a photo first',
  'battle.loadingOpponent': 'Loading opponent...',
  'battleReveal.title': 'Battle Result',
  'battleReveal.yourLabel': 'Your Photo',
  'battleReveal.opponentLabel': 'Professional',
  'battleReveal.win': 'You Win!',
  'battleReveal.winSub': 'Your photo prevailed in this showdown',
  'battleReveal.lose': 'Challenge Failed',
  'battleReveal.loseSub': 'The professional showed stronger skills',
  'battleReveal.draw': 'A Draw!',
  'battleReveal.drawSub': 'Both photos are equally matched',
  'battleReveal.yourReview': 'Review of Your Photo',
  'battleReveal.opponentReview': 'Review of Opponent\'s Photo',
  'battleReveal.comparison': 'Comparative Analysis',
  'battleReveal.attribution': 'Opponent: ',
  'battleReveal.photographerBy': 'Photo by ',
  'battleReveal.fromUnsplash': 'via Unsplash',
  'donate.title': 'Support Us',
  'donate.subtitle': 'Your support helps us improve the experience',
  'donate.custom': 'Custom amount',
  'donate.redirecting': 'Redirecting...',
  'donate.confirm': 'Donate',
  'donate.footer': 'Secure payments by Stripe · Visa / Mastercard / Alipay',
  'donate.errorMin': 'Minimum is',
  'donate.errorCreate': 'Failed to create payment session. Please try again.',
}

export const translations: Record<Locale, Record<TranslationKey, string>> = { zh, en }
