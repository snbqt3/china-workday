// api/is-workday.js
import fetch from 'node-fetch';

// 设置时区（Vercel 默认 UTC，必须显式设为上海）
process.env.TZ = 'Asia/Shanghai';

// 缓存节假日数据（Vercel 实例可能复用，可提升性能）
let holidayCache = null;
let lastFetched = 0;
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 小时

async function getHolidayData() {
  const now = Date.now();
  if (holidayCache && now - lastFetched < CACHE_DURATION) {
    return holidayCache;
  }

  try {
    // 使用国内可访问的 Coding.net 镜像
    const url = 'https://natescarlet.coding.net/p/holiday-cn/d/holiday-cn/git/raw/master/dist/holidays.json';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    holidayCache = data;
    lastFetched = now;
    return data;
  } catch (err) {
    console.warn('⚠️ 节假日数据加载失败，回退到周末逻辑:', err.message);
    return null;
  }
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default async function handler(req, res) {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = new Date();
    const todayStr = formatDate(now);
    const dayOfWeek = now.getDay(); // 0=周日, 6=周六

    // 获取节假日数据
    const holidayData = await getHolidayData();

    let result;
    if (holidayData && holidayData[todayStr]) {
      const info = holidayData[todayStr];
      if (info.isOffDay) {
        result = { isWorkday: false, info: info.name || '节假日' };
      } else if (info.isWorkday) {
        result = { isWorkday: true, info: '调休上班' };
      } else {
        // 理论上不会走到这里
        result = { isWorkday: dayOfWeek !== 0 && dayOfWeek !== 6, info: '普通日期' };
      }
    } else {
      // 无特殊标记，按周末判断
      result = {
        isWorkday: dayOfWeek !== 0 && dayOfWeek !== 6,
        info: dayOfWeek === 0 || dayOfWeek === 6 ? '周末' : '工作日'
      };
    }

    res.status(200).json({
      date: todayStr,
      isWorkday: result.isWorkday,
      info: result.info,
      timestamp: now.toString()
    });
  } catch (err) {
    console.error('❌ 接口错误:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}