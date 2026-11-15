// Load Test Script for k6
// Run: k6 run load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp to 100
    { duration: '5m', target: 100 },  // Stay at 100
    { duration: '2m', target: 200 },  // Stress test
    { duration: '5m', target: 200 },  // Stay at 200
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'loadtest@example.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'LoadTest123!';

let authToken = '';

export function setup() {
  // Login and get session
  const loginRes = http.post(`${BASE_URL}/api/auth/callback/credentials`, {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  
  check(loginRes, { 'login successful': (r) => r.status === 200 });
  
  // Extract session cookie
  const cookies = loginRes.cookies;
  const sessionCookie = cookies['next-auth.session-token']?.[0] || cookies['__session']?.[0];
  
  return { sessionCookie };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `next-auth.session-token=${data.sessionCookie}`,
  };

  // Test 1: Health check
  let res = http.get(`${BASE_URL}/api/health`, { headers });
  check(res, { 'health check 200': (r) => r.status === 200 }) || errorRate.add(1);

  // Test 2: List properties
  res = http.get(`${BASE_URL}/api/properties?page=1&pageSize=10`, { headers });
  check(res, { 'properties list 200': (r) => r.status === 200 }) || errorRate.add(1);

  // Test 3: List maintenance requests
  res = http.get(`${BASE_URL}/api/maintenance-requests?page=1&pageSize=10`, { headers });
  check(res, { 'maintenance requests 200': (r) => r.status === 200 }) || errorRate.add(1);

  // Test 4: List work orders
  res = http.get(`${BASE_URL}/api/work-orders?page=1&pageSize=10`, { headers });
  check(res, { 'work orders 200': (r) => r.status === 200 }) || errorRate.add(1);

  // Test 5: Dashboard stats
  res = http.get(`${BASE_URL}/api/dashboard/stats`, { headers });
  check(res, { 'dashboard stats 200': (r) => r.status === 200 }) || errorRate.add(1);

  // Test 6: Create property (write operation - 10% of requests)
  if (Math.random() < 0.1) {
    const propertyData = {
      name: `Load Test Property ${Date.now()}`,
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      propertyType: 'APARTMENT',
    };
    
    res = http.post(`${BASE_URL}/api/properties`, JSON.stringify(propertyData), { headers });
    check(res, { 'create property 201': (r) => r.status === 201 }) || errorRate.add(1);
  }

  // Test 7: Create maintenance request (write operation - 10% of requests)
  if (Math.random() < 0.1) {
    const requestData = {
      propertyId: 'demo-prop-1',
      unitId: 'demo-unit-1',
      title: `Load test request ${Date.now()}`,
      description: 'Load test maintenance request',
      category: 'PLUMBING',
      priority: 'MEDIUM',
    };
    
    res = http.post(`${BASE_URL}/api/tenant/requests`, JSON.stringify(requestData), { headers });
    check(res, { 'create request 201': (r) => r.status === 201 }) || errorRate.add(1);
  }

  sleep(Math.random() * 2 + 1); // 1-3 seconds between requests
}

export function teardown(data) {
  // Cleanup if needed
  console.log('Load test completed');
}