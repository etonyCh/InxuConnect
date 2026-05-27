import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 500 }, // ramp-up to 500 users
    { duration: '15s', target: 500 }, // stay at 500 users
    { duration: '5s', target: 0 },    // ramp-down to 0 users
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],   // less than 1% errors
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete under 2s
  },
};

export default function () {
  // 1. Visiter la liste des logements
  const listingsRes = http.get('http://localhost:3001/api/listings');
  check(listingsRes, {
    'listings status is 200': (r) => r.status === 200,
  });
  sleep(1);

  // 2. Consulter le détail d'un logement
  const propRes = http.get('http://localhost:3001/api/listings/prop_1');
  check(propRes, {
    'property status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });
  sleep(1);

  // 3. Demander un code OTP
  const otpPayload = JSON.stringify({ phone: '+25779' + Math.floor(1000000 + Math.random() * 9000000) });
  const otpParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const otpRes = http.post('http://localhost:3001/api/auth/otp/send', otpPayload, otpParams);
  check(otpRes, {
    'otp send status is 200': (r) => r.status === 200,
  });
  sleep(2);
}
