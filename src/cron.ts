import axios, { AxiosResponse } from 'axios';

const DISCORD_WEBHOOK_URL: string | undefined = process.env.DISCORD_WEBHOOK_URL;

interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields: Array<{
    name: string;
    value: string;
    inline: boolean;
  }>;
  footer: {
    text: string;
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

  const message: DiscordMessage = {
    username: "薬リマインダーBot",
    avatar_url: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png",
    embeds: [{
      title: "💊 薬の服薬確認",
      description: "今日の薬はちゃんと飲みましたか？",
      color: 3447003,
      fields: [
        {
          name: "日時",
          value: timeString,
          inline: true
        },
        {
          name: "確認事項",
          value: "✅ 朝の薬\n✅ 昼の薬\n✅ 夜の薬",
          inline: false
        }
      ],
      footer: {
        text: "健康管理リマインダー"
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