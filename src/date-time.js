const dayMs = 86400000;
const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
export function currentLocalClock(now = new Date()) {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return { today, time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, seconds: now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() };
}
export function resolveDateInput(value, todayOverride) {
  const resolved = value === 'today' ? (todayOverride ?? currentLocalClock().today) : value;
  if (typeof resolved !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(resolved)) throw new Error('날짜를 YYYY-MM-DD 형식으로 입력해 주세요.');
  const date = new Date(`${resolved}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== resolved) throw new Error('실제로 존재하는 날짜를 입력해 주세요.');
  return resolved;
}
export function resolveTimeInput(value, nowOverride) {
  const resolved = value === 'now' ? (nowOverride ?? currentLocalClock().time) : value;
  if (typeof resolved !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(resolved)) throw new Error('시각은 00:00~23:59로 입력해 주세요.');
  return resolved;
}
const num = (value, label, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const n = Number(value);
  if (value === '' || value == null || !Number.isFinite(n) || n < min || n > max) throw new Error(`${label} 입력값을 확인해 주세요.`);
  return n;
};
const integer = (value, label, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const n = num(value, label, min, max);
  if (!Number.isInteger(n)) throw new Error(`${label}은 정수로 입력해 주세요.`);
  return n;
};
export function dateUtc(value, todayOverride) { return new Date(`${resolveDateInput(value, todayOverride)}T00:00:00Z`); }
const dateText = date => `${date.toISOString().slice(0, 10)} ${weekdays[date.getUTCDay()]}`;
const deltaDays = (a, b, today) => (dateUtc(b, today) - dateUtc(a, today)) / dayMs;
const include = value => value === 'yes';
export function dateDifference(v) {
  const today = v.today || currentLocalClock().today;
  const delta = deltaDays(v.start, v.end, today);
  const total = Math.abs(delta) + (include(v.includeStart) ? 1 : 0);
  return { rows: [['총 일수', total, 'days'], ['주·일', `${Math.floor(total / 7)}주 ${total % 7}일`, 'text'], ['방향', delta > 0 ? '미래' : delta < 0 ? '과거' : '같은 날', 'text'], ['시작일 요일', dateText(dateUtc(v.start, today)), 'text'], ['종료일 요일', dateText(dateUtc(v.end, today)), 'text']], note: '날짜만 비교하며 시각과 시간대는 결과에 영향을 주지 않습니다.' };
}
export function dateOffset(v) {
  const days = integer(v.days, '일수', 0, 365000);
  if (!['after', 'before'].includes(v.direction)) throw new Error('일 전·후를 선택해 주세요.');
  const signed = days * (v.direction === 'after' ? 1 : -1);
  const target = new Date(dateUtc(v.base, v.today || currentLocalClock().today).getTime() + signed * dayMs);
  if (target.getUTCFullYear() < 1 || target.getUTCFullYear() > 9999) throw new Error('결과 날짜가 지원 범위를 벗어납니다.');
  return { rows: [['계산한 날짜', dateText(target), 'text'], ['기준일부터', `${signed >= 0 ? '+' : ''}${signed}일`, 'text'], ['요일', weekdays[target.getUTCDay()], 'text']], note: '기준일에서 지정한 일수만큼 이동합니다. 기준일 자체는 0일입니다.' };
}
export function dday(v) {
  const today = v.today || currentLocalClock().today;
  const start = v.start || 'today';
  const delta = deltaDays(start, v.target, today);
  return { rows: [['D-Day', delta > 0 ? `D-${delta}` : delta < 0 ? `D+${-delta}` : 'D-Day', 'text'], ['총 일수', Math.abs(delta), 'days'], ['총 시간', Math.abs(delta) * 24, 'hours'], ['기준일', dateText(dateUtc(start, today)), 'text'], ['목표일', dateText(dateUtc(v.target, today)), 'text']], note: '입력한 날짜의 자정끼리 비교합니다. 시작일을 비우면 브라우저의 오늘 날짜를 사용합니다.' };
}
// Public holidays can later be supplied as an isHoliday(dateString) predicate.
export function businessDays(v, isHoliday = () => false) {
  const today = v.today || currentLocalClock().today;
  const start = dateUtc(v.start, today), end = dateUtc(v.end, today);
  const direction = end >= start ? 1 : -1;
  const count = Math.abs((end - start) / dayMs) + (include(v.includeStart) ? 1 : 0);
  let weekdaysCount = 0, weekend = 0, holidays = 0;
  for (let i = include(v.includeStart) ? 0 : 1; i < count + (include(v.includeStart) ? 0 : 1); i++) {
    const day = new Date(start.getTime() + i * direction * dayMs);
    if ([0, 6].includes(day.getUTCDay())) weekend++;
    else if (isHoliday(day.toISOString().slice(0, 10))) holidays++;
    else weekdaysCount++;
  }
  return { rows: [['평일 수', weekdaysCount, 'days'], ['전체 일수', count, 'days'], ['주말 수', weekend, 'days'], ...(holidays ? [['별도 제외일', holidays, 'days']] : [])], note: '현재는 토·일요일 제외 기준이며 법정공휴일은 반영하지 않습니다.' };
}
export function timeMinutes(value, nowOverride) {
  const [hour, minute] = resolveTimeInput(value, nowOverride).split(':').map(Number);
  return hour * 60 + minute;
}
export function shiftMinutes(start, end, breakMinutes) {
  const begin = timeMinutes(start), finish = timeMinutes(end);
  const stay = (finish - begin + 1440) % 1440;
  const rest = integer(breakMinutes, '휴게시간', 0, 1439);
  if (!stay || rest > stay) throw new Error('퇴근시각과 휴게시간을 확인해 주세요. 최대 24시간 미만 근무를 지원합니다.');
  return { stay, rest, worked: stay - rest, overnight: finish <= begin };
}
const duration = minutes => {
  const rounded = Math.round(Math.abs(minutes));
  return `${minutes < 0 ? '-' : ''}${Math.floor(rounded / 60)}시간 ${rounded % 60}분`;
};
export function workTime(v) {
  const x = shiftMinutes(v.startTime, v.endTime, v.breakMinutes);
  return { rows: [['실제 근무시간', duration(x.worked), 'text'], ['총 체류시간', duration(x.stay), 'text'], ['휴게시간', duration(x.rest), 'text']], note: x.overnight ? '퇴근시각을 다음 날로 계산했습니다.' : '휴게시간을 총 체류시간에서 차감했습니다.' };
}
export function playbackSpeed(v) {
  const hours = integer(v.hours, '영상 시간', 0, 999), minutes = integer(v.minutes, '영상 분', 0, 59);
  const original = hours * 60 + minutes;
  if (!original) throw new Error('영상 길이는 0보다 커야 합니다.');
  const speed = v.speed === 'custom' ? num(v.customSpeed, '직접 입력한 배속', 0.1, 16) : num(v.speed, '배속', 0.1, 16);
  const actual = original / speed, saved = original - actual;
  const startTime = resolveTimeInput(v.startTime, v.nowTime);
  const start = timeMinutes(startTime);
  const end = Math.round(start + actual);
  const endDay = Math.floor(end / 1440), endMinute = end % 1440;
  const endText = `${String(Math.floor(endMinute / 60)).padStart(2, '0')}:${String(endMinute % 60).padStart(2, '0')}${endDay ? ` (+${endDay}일)` : ''}`;
  return { rows: [['종료 예상 시각', endText, 'text'], ['실제 시청시간', duration(actual), 'text'], [saved < 0 ? '추가 소요시간' : '절약시간', duration(saved), 'text'], ['시간 절약률', (1 - 1 / speed) * 100, 'percent']], note: `시작 시각 ${startTime} 기준. 배속은 재생시간만 바꾸며 중간 정지는 포함하지 않습니다.` };
}
export function clockProgress(start, end, breakMinutes, nowSeconds) {
  const x = shiftMinutes(start, end, breakMinutes);
  const begin = timeMinutes(start) * 60, finish = begin + x.stay * 60;
  let current = num(nowSeconds, '현재 시각', 0, 86399);
  if (x.overnight && current < timeMinutes(end) * 60) current += 86400;
  const elapsed = Math.max(0, Math.min(finish - begin, current - begin));
  const state = current < begin ? 'before' : current >= finish ? 'after' : 'during';
  return { ...x, state, remainingSeconds: state === 'before' ? begin - current : Math.max(0, finish - current), elapsedSeconds: elapsed, progress: elapsed / (x.stay * 60) * 100, workedSeconds: elapsed * x.worked / x.stay };
}
const remainingText = seconds => `${Math.floor(seconds / 3600)}시간 ${Math.floor(seconds % 3600 / 60)}분`;
export function workClock(v) {
  const x = clockProgress(v.startTime, v.endTime, v.breakMinutes, v.nowSeconds ?? currentLocalClock().seconds);
  const headline = x.state === 'before' ? `출근까지 ${remainingText(x.remainingSeconds)}` : x.state === 'after' ? '오늘도 수고했어요 🎉' : `퇴근까지 ${remainingText(x.remainingSeconds)}`;
  return { rows: [['퇴근시계', headline, 'text'], ['오늘 총 근무시간', duration(x.worked), 'text'], ['현재까지 근무시간', duration(x.workedSeconds / 60), 'text'], ['근무 진행률', x.progress, 'percent'], ['퇴근 상태', x.state === 'after' ? '퇴근 완료' : x.state === 'before' ? '근무 시작 전' : '근무 중', 'text']], progress: x.progress, note: '현재 시각은 브라우저 기준입니다. 휴게시간은 근무 구간에 균등하게 반영한 추정치입니다.' };
}
export function salaryClock(v) {
  if (!['gross', 'net'].includes(v.salaryType ?? 'gross')) throw new Error('월급 기준을 선택해 주세요.');
  const salary = num(v.monthlySalary, '월급', 0, 100000000000), days = integer(v.workDays, '월 근무일수', 1, 31), hours = num(v.dailyHours, '1일 근무시간', 0.1, 23.9);
  const x = clockProgress(v.startTime, v.endTime, v.breakMinutes, v.nowSeconds ?? currentLocalClock().seconds);
  if (Math.abs(x.worked - hours * 60) > 1) throw new Error('1일 근무시간은 출퇴근시각에서 휴게시간을 뺀 값과 같아야 합니다.');
  const dayPay = salary / days, hourPay = dayPay / hours;
  const earned = dayPay * x.progress / 100;
  return { rows: [['오늘 번 돈', earned, 'money'], ['시간당 수입', hourPay, 'money'], ['분당 수입', hourPay / 60, 'money'], ['초당 수입', hourPay / 3600, 'money'], ['오늘 예상 총 수입', dayPay, 'money'], ['이번 달 예상 수입', salary, 'money'], ['퇴근까지', x.state === 'after' ? '퇴근 완료' : x.state === 'before' ? `출근까지 ${remainingText(x.remainingSeconds)}` : remainingText(x.remainingSeconds), 'text']], progress: x.progress, note: `${v.salaryType === 'net' ? '실수령 월급' : '세전 월급'}을 기준으로 한 단순 시간 비례 추정입니다. 세금·수당·휴일근로·연장근로는 자동 반영하지 않습니다. 휴게시간은 근무 구간에 균등하게 배분합니다.` };
}
export const dateTimeCalculators = {
  'date-diff': dateDifference, 'date-offset': dateOffset, dday, 'business-days': businessDays,
  'work-time': workTime, 'playback-speed': playbackSpeed, 'work-clock': workClock, 'salary-clock': salaryClock
};
