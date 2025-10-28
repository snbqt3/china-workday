// api/is-workday.js
export default async function handler(req, res) {
  // 获取中国当前日期（UTC+8）
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  try {
    // 动态请求当年的节假日数据
    const url = `https://raw.githubusercontent.com/NateScarlet/holiday-cn/main/data/${year}.json`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`⚠️ 未找到 ${year} 年节假日数据，回退到周末判断`);
      const dayOfWeek = now.getDay();
      const isWorkday = dayOfWeek !== 0 && dayOfWeek !== 6;
      return res.status(200).json({
        date: todayStr,
        isWorkday,
        info: isWorkday ? '工作日' : '周末',
        source: 'fallback'
      });
    }

    const holidayData = await response.json();
    const info = holidayData[todayStr];

    let isWorkday, reason;
    if (info) {
      isWorkday = info.isWorkday || false;
      reason = info.isOffDay ? (info.name || '节假日') : '调休上班';
    } else {
      const dayOfWeek = now.getDay();
      isWorkday = dayOfWeek !== 0 && dayOfWeek !== 6;
      reason = isWorkday ? '工作日' : '周末';
    }

    res.status(200).json({
      date: todayStr,
      isWorkday,
      info: reason,
      source: `${year}.json`
    });

  } catch (err) {
    console.error('❌ 请求节假日数据失败:', err.message);
    // 最终回退
    const dayOfWeek = new Date(Date.now() + 8 * 60 * 60 * 1000).getDay();
    const isWorkday = dayOfWeek !== 0 && dayOfWeek !== 6;
    res.status(200).json({
      date: todayStr,
      isWorkday,
      info: isWorkday ? '工作日' : '周末',
      error: err.message
    });
  }
}
