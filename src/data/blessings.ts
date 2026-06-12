import type { Blessing } from '../types'

/**
 * 粉丝祝福数据
 * 修改此文件即可更新祝福内容，无需修改任何组件代码
 */
export const blessingsData: Blessing[] = [
  {
    id: 'wish_001',
    from: '猫耳守护骑士',
    text: '祝Ling生日快乐！从最初的小直播间一路陪伴走到今天，看到你越来越闪耀，真的太感动了。新的一岁也要天天开心，医疗包和糖果都给你准备好啦！',
    audioUrl: 'https://cdn.example.com/audio/wish001.mp3',
    styleType: 'cherry-blossom',
  },
  {
    id: 'wish_002',
    from: '腮红小猪守护者',
    text: '生日快乐鸭！这个纪念网站是我们所有粉丝送给你的礼物。希望你喜欢蛋糕上的那只小猪，它代表我们一直陪在你身边！',
    styleType: 'classic-letter',
  },
  {
    id: 'wish_003',
    from: '星空下的约定',
    text: 'Ling酱生日快乐！每次深夜直播你都会说"还有人在吗"，其实我们一直都在哦。愿你被世界温柔以待！',
    audioUrl: 'https://cdn.example.com/audio/wish003.mp3',
    styleType: 'city-pop-vinyl',
  },
  {
    id: 'wish_004',
    from: '医疗小队队长',
    text: '生日快乐！你治愈了我们，今天换我们来给你送上最好的祝福。新的一岁，健康快乐最重要！',
    styleType: 'classic-letter',
  },
  {
    id: 'wish_005',
    from: '无名的小粉丝',
    text: 'Ling生日快乐呀！虽然我只是直播间里一个小小的观众，但你的每次直播都能让我在疲惫的一天后露出笑容。谢谢你，要一直幸福下去！',
    styleType: 'cherry-blossom',
  },
]

/** 祝福总数 */
export const totalBlessings = blessingsData.length
