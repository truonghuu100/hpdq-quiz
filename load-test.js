import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://hpdq-quiz.onrender.com';
const VUS = Number(__ENV.VUS || 150);

export const options = {
  stages: [
    { duration: '30s', target: Math.ceil(VUS * 0.2) },
    { duration: '30s', target: Math.ceil(VUS * 0.5) },
    { duration: '30s', target: VUS },
    { duration: '2m', target: VUS },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const paths = ['/', '/app.js', '/styles.css'];
  for (const path of paths) {
    const response = http.get(BASE_URL + path, { tags: { resource: path } });
    check(response, {
      'HTTP status 200': (r) => r.status === 200,
    });
  }
}
