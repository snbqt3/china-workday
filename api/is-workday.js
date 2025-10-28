import fetch from 'node-fetch';

// 强制设置为中国时间（UTC+8）
function getChinaDate() {
  const now = new Date();
  return new Date(now.getTime() + 8 * 60 * 60 * 1000);
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export default async function handler(req, res) {
  const now = getChinaDate();
  const todayStr = formatDate(now);

  try {
    // 使用 GitHub 镜像（更稳定）
    const url = 'https://raw.githubusercontent.com/NateScarlet/holiday-cn/master/dist/holidays.json';
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const holidays = await response.json();
    const info = holidays[todayStr];

    let isWorkday, reason;

    if (info) {
      isWorkday = info.isWorkday || false;
      reason = info.isOffDay ? (info.name || '节假日') : '调休上班';
    } else {
      const day = now.getDay(); // 0=周日, 6=周六
      isWorkday = day !== 0 && day !== 6;
      reason = isWorkday ? '工作日' : '周末';
    }

    res.status(200).json({
      date: todayStr,
      isWorkday,
      info: reason,
      timestamp: now.toString()
    });

  } catch (err) {
    console.error('❌ 请求失败:', err.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message
    });
  }
}
