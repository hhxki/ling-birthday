import { asset } from './config'
import type { Blessing } from '../types'

/**
 * 粉丝祝福数据
 * 修改此文件即可更新祝福内容，无需修改任何组件代码
 * 所有资源路径（头像、语音）统一通过 asset() 拼接，切换 CDN / 本地模式自动生效
 */
export const blessingsData: Blessing[] = [
  {
    id: 'wish_001',
    user: '小白白i_激推由川伶',
    text: '伶伶18岁生日快乐，祝伶伶永远十八貌美如花，希望我们未来能一直在一起，最后……我是由川伶的狗，由川伶给俺看看jio',
    avatarUrl: asset('/avatars/小白白i_激推由川伶.webp'),
    audioUrl: asset('/audio/老白.mp3'),
  },
  {
    id: 'wish_002',
    user: '止乔今天又被爆了',
    text: '要和生活对线都没什么时间看伶子了，但是生日祝福还是得送的。祝我们最最最可爱的由川伶小猫崽子生日快乐呀。祝你永不摔跤，日进斗金，每天都能收获属于自己的幸福，最重要的是用猫砂盆的时候天天通畅哦。平时别累着自己了，早餐我放早餐店了，记得自己去拿；下雨了要记得打伞；困了要记得睡觉；累了要记得休息；祝你永远是最开心的小猫！',
    avatarUrl: asset('/avatars/止乔今天又被爆了.webp'),
  },
  {
    id: 'wish_003',
    user: '入夜观雪',
    text: '祝聪明可爱善良美丽的宗主大人生日快乐！认识伶宝已经两个月了，感谢伶宝在这段时光里带来的快乐与陪伴，让我在平凡的日子里收获了不平凡的回忆与感动。祝伶宝天天开心，勇敢向前，做自己喜欢做的事，直播越来越好！',
    avatarUrl: asset('/avatars/入夜观雪.webp'),
  },
  {
    id: 'wish_004',
    user: 'Vince迷航者',
    text: '生日快乐！愿0宝接下来的日子顺顺利利，少些烦恼，多些开心，想要的都慢慢实现。',
    avatarUrl: asset('/avatars/Vince迷航者.webp'),
  },
  {
    id: 'wish_005',
    user: '边沐浴边鹿',
    text: '祝0宝生日快乐喔！作为直播间得新老人，也是陪0过了第一个生日！愿新的一岁，直播永远高能，人气永远爆棚！天天都能吃一灯仙丹！吃蛋糕吃到胀到了！跟所有的烦恼嗦拜拜，跟所有的快乐嗦嗨嗨！',
    avatarUrl: asset('/avatars/边沐浴边鹿.webp'),
    videoUrl: asset('/video/边沐浴边鹿.mp4'),
  },
  {
    id: 'wish_006',
    user: 'ke学家XG',
    text: '                        ___\n          .-._     _.../ + \\..._    _.-.\n          |   `\'-\'     \\        \\\'-\'`    |\n         /              \\          \\      \\\n         ;    ___        \\          \\     ;\n         |    \\_/          \\          \\     |\n         \\               /\\  \\          \\  /\n         \'--------------------------------\'\n                       生日快乐！\n\n祝伶宝生日快乐！天天开心，越播越好！',
    avatarUrl: asset('/avatars/ke学家XG.webp'),
  },
  {
    id: 'wish_007',
    user: '是擽希晝吖',
    text: '伶宝，生日快乐⌯oᴗo⌯\n一首长诗，你在邮箱里看过了，就附赠一个短诗（哎嘿）\n\n由来蕙质本天成，\n川漾清光映月明。\n伶语嫣然春意暖，\n生辰花好伴川行。\n\n万物皆需成长，包括你的美好。\n岁月为名，情谊为证。\n愿你即使年年岁岁花相似，也要岁岁年年人不同——不同在于，更自信，更自由，更快乐。\n生日快乐，我们的朋友，伶宝',
    avatarUrl: asset('/avatars/是擽希晝吖.webp'),
  },  
  {
    id: 'wish_008',
    user: 'JunXi',
    text: '时时笑颜开，处处好运来，祝伶宝在新的一年，岁岁平安，年年有余；福如东海，寿比南山；吉星高照，好运连连；平安喜乐，万事胜意。生日快乐，伶宝！',
    avatarUrl: asset('/avatars/JunXi.png'),
    audioUrl: asset('/audio/JunXi.m4a'),
  }, 
  {
    id: 'wish_009',
    user: '龟田瘪三郎',
    text: '小伶生日快乐哦！俺也算是在小伶刚开播的时候就从直播间里刷出来的老资历野怪了，中间错失了一大段的陪伴时间，不过幸好能赶上今年的生日回。祝伶在新的一年事业腾飞，人气爆棚，舰长破万，身体健康，天天开心。',
    avatarUrl: asset('/avatars/龟田瘪三郎.jpg'),
  },
  {
    id: 'wish_010',
    user: '刘文乐Venlo',
    text: '今天是6月13日。祝伶酱生日快乐！因为TK音声让我们相遇，依旧在聆听，一直在陪伴。伶酱新的一岁到来之际也要笑口常开，开怀大笑。希望伶酱将来为我们带来更多的TK音声，也期待着有一天我能和伶酱合作。\n\nFrom B站虚拟主播 @刘文乐Venlo',
    avatarUrl: asset('/avatars/刘文乐Venlo.webp'),
    audioUrl: asset('/audio/刘文乐Venlo.m4a'),
  },
    {
    id: 'wish_011',
    user: '念倾雨天',
    text: '在这里祝伶姐生日快乐！！！🍰遇见你真的很幸运，很高兴陪你长大一岁，也让我们看到了最真诚、善良且坚韧的你。祝你得偿所愿，希望接下来的日子像烟花一样灿烂，今天！明天！每一天！',
    avatarUrl: asset('/avatars/念倾雨天.webp'),
    audioUrl: asset('/audio/念倾雨天.mp3'),
  },
  {
    id: 'wish_012',
    user: '昨夜晨光zjx2',
    text: '伶宝生日快乐',
    avatarUrl: asset('/avatars/昨夜晨光zjx2.webp'),
    audioUrl: asset('/audio/昨夜晨光zjx2.m4a'),
  },
]

/** 祝福总数 */
export const totalBlessings = blessingsData.length
