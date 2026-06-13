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
    user: '老白',
    text: '祝Ling生日快乐！从最初的小直播间一路陪伴最初的小直播间一路陪伴走到今天，看到你越来越闪耀，真的太感动了。新的一岁也要天天开心，医疗包和糖果都给你准备好啦！',
    avatarUrl: asset('/avatars/老白.webp'),
    audioUrl: asset('/audio/老白.mp3'),
  },
  {
    id: 'wish_002',
    user: '腮红小猪守护者',
    text: '生日快乐鸭！这个纪念网站是我们所有粉丝送给你的礼物。希望你喜欢蛋糕上的那只小猪，它代表我们一直陪在你身边！',
    avatarUrl: asset('/assets/avatars/pig-guardian.png'),
  },
  {
    id: 'wish_003',
    user: '星空下的约定',
    text: 'Ling酱生日快乐！每次深夜直播你都会说"还有人在吗"，其实我们一直都在哦。愿你被世界温柔以待！',
    avatarUrl: asset('/assets/avatars/starry-promise.png'),
    audioUrl: asset('/assets/audio/wish_003.mp3'),
  },
  {
    id: 'wish_004',
    user: '医疗小队队长',
    text: '生日快乐！你治愈了我们，今天换我们来给你送上最好的祝福。新的一岁，健康快乐最重要！',
    avatarUrl: asset('/assets/avatars/medic-captain.png'),
  },
  {
    id: 'wish_005',
    user: '无名的小粉丝',
    text: 'Ling生日快乐呀！虽然我只是直播间里一个小小的观众，但你的每次直播都能让我在疲惫的一天后露出笑容。谢谢你，要一直幸福下去！',
    avatarUrl: asset('/assets/avatars/nameless-fan.png'),
  },
  {
    id: 'wish_006',
    user: '无名的小粉',
    text: 'Ling生日快乐呀！虽然我只是直播间里一个小小的观众，但你的每次直播都能让我在疲惫的一天后露出笑容。谢谢你，要一直幸福下去！',
    avatarUrl: asset('/assets/avatars/nameless-fan.png'),
  },
]

/** 祝福总数 */
export const totalBlessings = blessingsData.length
