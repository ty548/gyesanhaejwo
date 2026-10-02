export const rateErrors = Object.freeze({
  UNSUPPORTED_CURRENCY: 'UNSUPPORTED_CURRENCY',
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  INVALID_RATE: 'INVALID_RATE',
  MANUAL_RATE_REQUIRED: 'MANUAL_RATE_REQUIRED'
});

export const rateErrorMessages = Object.freeze({
  UNSUPPORTED_CURRENCY: '자동 환율 조회를 지원하지 않는 통화입니다. 직접 환율을 입력해 주세요.',
  NETWORK_ERROR: '네트워크 연결로 환율 정보를 불러오지 못했습니다. 잠시 후 다시 시도하거나 직접 환율을 입력해 주세요.',
  API_ERROR: '현재 환율 정보를 불러오지 못했습니다. 잠시 후 다시 시도하거나 직접 환율을 입력해 주세요.',
  INVALID_RATE: '유효한 환율 정보를 확인하지 못했습니다. 직접 환율을 입력해 주세요.',
  MANUAL_RATE_REQUIRED: '이 통화쌍의 자동 환율이 제공되지 않습니다. 직접 환율을 입력해 주세요.'
});

const failure = error => ({ rate: null, date: null, error });

export async function lookupRate(fetcher, from, to) {
  if (from === to) return { rate: 1, date: null, error: null };
  let response;
  try {
    response = await fetcher(`https://api.frankfurter.dev/v2/rate/${from.toLowerCase()}/${to.toLowerCase()}`);
  } catch {
    return failure(rateErrors.NETWORK_ERROR);
  }
  if (!response.ok) {
    if ([400, 404, 422].includes(response.status)) {
      let message = '';
      try { message = String((await response.json()).message ?? ''); } catch { /* malformed API error */ }
      if (/invalid currency|unknown currency|unsupported currency/i.test(message)) return failure(rateErrors.UNSUPPORTED_CURRENCY);
      if (response.status === 404 || /rate|currency pair/i.test(message)) return failure(rateErrors.MANUAL_RATE_REQUIRED);
    }
    return failure(rateErrors.API_ERROR);
  }
  let data;
  try { data = await response.json(); } catch { return failure(rateErrors.INVALID_RATE); }
  if (!(Number.isFinite(data?.rate) && data.rate > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(data?.date)) return failure(rateErrors.INVALID_RATE);
  return { rate: data.rate, date: data.date, error: null };
}
