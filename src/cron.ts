import axios, { AxiosResponse } from 'axios';

const DISCORD_WEBHOOK_URL: string | undefined = process.env.DISCORD_WEBHOOK_URL;

interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  thumbnail?: {
    url: string;
  };
  image?: {
    url: string;
  };
  fields: Array<{
    name: string;
    value: string;
    inline: boolean;
  }>;
  footer: {
    text: string;
    icon_url?: string;
  };
  timestamp: string;
}

interface DiscordMessage {
  username?: string;
  avatar_url?: string;
  embeds: DiscordEmbed[];
}

async function sendMedicationReminder(): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) {
    console.error('DISCORD_WEBHOOK_URL environment variable is not set');
    process.exit(1);
  }

  const now = new Date();
  const timeString = now.toLocaleString('ja-JP', { 
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const dayOfWeek = now.toLocaleDateString('ja-JP', { 
    timeZone: 'Asia/Tokyo',
    weekday: 'long' 
  });

  // 日本時間を取得
  const japanTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
  const hour = japanTime.getHours();
  const minute = japanTime.getMinutes();
  
  const timeOfDay = hour < 12 ? '朝' : hour < 18 ? '昼' : '夜';
  const greeting = hour < 12 ? 'おはようございます！' : hour < 18 ? 'お疲れ様です！' : 'お疲れ様でした！';

  // 今日の服薬スケジュール
  const medicationSchedule = [
    { time: '08:00', type: '朝食後', status: hour >= 8 ? '⏰' : '⌛' },
    { time: '12:30', type: '昼食後', status: hour >= 12.5 ? '⏰' : '⌛' },
    { time: '19:00', type: '夕食後', status: hour >= 19 ? '⏰' : '⌛' },
    { time: '22:00', type: '就寝前', status: hour >= 22 ? '⏰' : '⌛' }
  ];

  const upcomingMeds = medicationSchedule
    .filter(med => {
      const medHour = parseInt(med.time.split(':')[0]);
      const medMinute = parseInt(med.time.split(':')[1]);
      const medTime = medHour + medMinute / 60;
      const currentTime = hour + minute / 60;
      return medTime > currentTime;
    })
    .slice(0, 2);

  const message: DiscordMessage = {
    username: "薬リマインダーBot",
    avatar_url: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png",
    embeds: [{
      title: `💊 ${timeOfDay}の服薬確認`,
      description: `${greeting}\n今日も健康管理を頑張りましょう！`,
      color: timeOfDay === '朝' ? 0xFFD700 : timeOfDay === '昼' ? 0x87CEEB : 0x9370DB,
      thumbnail: {
        url: "https://cdn-icons-png.flaticon.com/512/3004/3004458.png"
      },
      fields: [
        {
          name: "📅 日時情報",
          value: `**${dayOfWeek}** - ${timeString}`,
          inline: true
        },
        {
          name: "🕐 現在の時間帯",
          value: `${timeOfDay}の時間帯です`,
          inline: true
        },
        {
          name: "📋 今日の服薬スケジュール",
          value: medicationSchedule
            .map(med => `${med.status} **${med.time}** - ${med.type}`)
            .join('\n'),
          inline: false
        },
        ...(upcomingMeds.length > 0 ? [{
          name: "⏭️ 次回の服薬予定",
          value: upcomingMeds
            .map(med => `🔔 **${med.time}** - ${med.type}`)
            .join('\n'),
          inline: false
        }] : []),
        {
          name: "✅ 確認事項",
          value: [
            "□ 薬を正しい時間に服用しましたか？",
            "□ 水分と一緒に服用しましたか？", 
            "□ 副作用や体調変化はありませんか？",
            "□ 次回分の薬の準備はできていますか？"
          ].join('\n'),
          inline: false
        },
        {
          name: "💡 健康チップ",
          value: [
            "🥤 薬は十分な水で服用しましょう",
            "🍽️ 食後の薬は食事から30分以内に",
            "📝 気になる症状があれば記録しましょう",
            "💤 規則正しい生活リズムも大切です"
          ][Math.floor(Math.random() * 4)],
          inline: false
        }
      ],
      footer: {
        text: "健康管理リマインダー | 毎日お疲れ様です！",
        icon_url: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png"
      },
      timestamp: now.toISOString()
    }]
  };

  try {
    const response: AxiosResponse = await axios.post(DISCORD_WEBHOOK_URL, message);
    console.log(`✅ Discord notification sent successfully at ${timeString}`);
    console.log(`Response status: ${response.status}`);
  } catch (error: any) {
    console.error('❌ Failed to send Discord notification:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

sendMedicationReminder();