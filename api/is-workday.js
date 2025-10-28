import fetch from 'node-fetch';
process.env.TZ = 'Asia/Shanghai';

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

export default async function handler(req, res) {
  const today = new Date();
  const dateStr = formatDate(today);
  
  try {
    const response = await fetch('https://natescarlet.coding.net/p/holiday-cn/d/holiday-cn/git/raw/master/dist/holidays.json');
    const holidays = await response.json();
    
    const info = holidays[dateStr];
    let isWorkday, reason;
    
    if (info) {
      isWorkday = info.isWorkday || false;
      reason = info.isOffDay ? (info.name || '节假日') : '调休上班';
    } else {
      const day = today.getDay();
      isWorkday = day !== 0 && day !== 6;
      reason = isWorkday ? '工作日' : '周末';
    }

    res.status(200).json({ date: dateStr, isWorkday, info: reason });
  } catch (err) {
    // 回退逻辑（无网络时按周末判断）
    const day = today.getDay();
    const fallback = day !== 0 && day !== 6;
    res.status(200).json({ date: dateStr, isWorkday: fallback, info: fallback ? '工作日' : '周末' });
  }
}
