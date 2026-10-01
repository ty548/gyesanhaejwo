import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDateInput, dateDifference, dateOffset, dday, businessDays, workTime, playbackSpeed, clockProgress, salaryClock } from '../src/date-time.js';

test('today sentinel과 명시 날짜를 공통 규칙으로 해석', () => {
  assert.equal(resolveDateInput('today', '2026-10-01'), '2026-10-01');
  assert.equal(resolveDateInput('2024-02-29'), '2024-02-29');
  assert.throws(() => resolveDateInput('2025-02-29'), /존재/);
  assert.throws(() => resolveDateInput('tomorrow'), /YYYY-MM-DD/);
  assert.equal(dateDifference({ start: 'today', end: '2026-10-02', includeStart: 'no', today: '2026-10-01' }).rows[0][1], 1);
});

test('윤년·비윤년·DST 경계의 날짜 차이는 달력 일수', () => {
  assert.equal(dateDifference({ start: '2024-02-28', end: '2024-03-01', includeStart: 'no' }).rows[0][1], 2);
  assert.equal(dateDifference({ start: '2024-02-29', end: '2024-03-01', includeStart: 'yes' }).rows[0][1], 2);
  assert.equal(dateDifference({ start: '2025-02-28', end: '2025-03-01', includeStart: 'no' }).rows[0][1], 1);
  assert.equal(dateDifference({ start: '2024-03-09', end: '2024-03-11', includeStart: 'no' }).rows[0][1], 2);
});

test('N일 후·전과 연말 이동', () => {
  assert.match(dateOffset({ base: '2026-10-01', days: 100, direction: 'after' }).rows[0][1], /^2027-01-09 토요일$/);
  assert.match(dateOffset({ base: '2026-12-31', days: 1, direction: 'after' }).rows[0][1], /^2027-01-01/);
  assert.match(dateOffset({ base: '2027-01-01', days: 1, direction: 'before' }).rows[0][1], /^2026-12-31/);
});

test('D-Day 미래·과거·당일', () => {
  assert.equal(dday({ start: '2026-10-01', target: '2026-10-11' }).rows[0][1], 'D-10');
  assert.equal(dday({ start: '2026-10-11', target: '2026-10-01' }).rows[0][1], 'D+10');
  assert.equal(dday({ start: '', target: '2026-10-01', today: '2026-10-01' }).rows[0][1], 'D-Day');
});

test('영업일은 주말만 제외하고 시작일 선택을 반영', () => {
  const inclusive = businessDays({ start: '2026-09-28', end: '2026-10-04', includeStart: 'yes' });
  assert.deepEqual(inclusive.rows.slice(0, 3).map(row => row[1]), [5, 7, 2]);
  const exclusive = businessDays({ start: '2026-09-28', end: '2026-10-04', includeStart: 'no' });
  assert.deepEqual(exclusive.rows.slice(0, 3).map(row => row[1]), [4, 6, 2]);
  assert.match(inclusive.note, /법정공휴일은 반영하지 않습니다/);
});

test('근무시간은 휴게와 자정 넘어가는 퇴근을 계산', () => {
  assert.equal(workTime({ startTime: '09:00', endTime: '18:00', breakMinutes: 0 }).rows[0][1], '9시간 0분');
  assert.equal(workTime({ startTime: '09:00', endTime: '18:00', breakMinutes: 60 }).rows[0][1], '8시간 0분');
  assert.equal(workTime({ startTime: '22:00', endTime: '06:00', breakMinutes: 60 }).rows[0][1], '7시간 0분');
});

test('영상 1.5배속과 2배속은 종료 시각·절약시간이 맞음', () => {
  const a = playbackSpeed({ hours: 2, minutes: 30, speed: '1.5', customSpeed: 1.5, startTime: '13:00' });
  assert.deepEqual(a.rows.slice(0, 3).map(row => row[1]), ['14:40', '1시간 40분', '0시간 50분']);
  const b = playbackSpeed({ hours: 2, minutes: 30, speed: '2', startTime: '23:30' });
  assert.equal(b.rows[0][1], '00:45 (+1일)');
  assert.equal(b.rows[1][1], '1시간 15분');
});

test('월급시계 환산과 출근 전·근무 중·퇴근 후', () => {
  const values = { monthlySalary: 3000000, workDays: 20, dailyHours: 8, startTime: '09:00', endTime: '18:00', breakMinutes: 60 };
  const before = clockProgress('09:00', '18:00', 60, 8 * 3600);
  const during = clockProgress('09:00', '18:00', 60, 13 * 3600);
  const after = clockProgress('09:00', '18:00', 60, 19 * 3600);
  assert.deepEqual([before.state, during.state, after.state], ['before', 'during', 'after']);
  const result = salaryClock({ ...values, nowSeconds: 13 * 3600 });
  assert.equal(result.rows[1][1], 18750);
  assert.equal(result.rows[2][1], 312.5);
  assert.ok(Math.abs(result.rows[3][1] - 18750 / 3600) < 1e-9);
  assert.equal(salaryClock({ ...values, nowSeconds: 8 * 3600 }).rows[0][1], 0);
  assert.equal(salaryClock({ ...values, nowSeconds: 19 * 3600 }).rows[0][1], 150000);
});
