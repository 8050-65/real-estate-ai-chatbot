# Testing Guide - Real Estate AI Chatbot

Complete testing suite for all three services: Frontend (Next.js), Backend (Spring Boot), and AI Service (FastAPI).

---

## Frontend Tests (Next.js + Jest + React Testing Library)

### Location
```
frontend/
├── components/__tests__/
│   ├── LoadingSpinner.test.tsx
│   └── KPICard.test.tsx
├── hooks/__tests__/
│   ├── useAuth.test.ts
│   └── useLeads.test.ts
├── lib/__tests__/
│   ├── utils.test.ts
│   └── auth.test.ts
├── jest.config.js
├── jest.setup.js
└── package.json (with test scripts)
```

### Running Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage

- ✅ **Components**: LoadingSpinner, KPICard
- ✅ **Hooks**: useAuth (login/logout), useLeads (pagination)
- ✅ **Utilities**: formatCurrency, formatDate, formatTimeAgo, cn()
- ✅ **Auth Library**: getStoredUser, storeUser, isAuthenticated, canViewAll

### Example Tests

```typescript
// Component Test
describe('KPICard', () => {
  it('renders title and value', () => {
    render(<KPICard title="Total Leads" value={152} />)
    expect(screen.getByText('Total Leads')).toBeInTheDocument()
  })
})

// Hook Test
describe('useAuth Hook', () => {
  it('handles login successfully', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {
      await result.current.login('admin@crm-cbt.com', 'Admin@123!')
    })
    expect(result.current.isAuthenticated).toBe(true)
  })
})

// Utility Test
describe('formatCurrency', () => {
  it('formats large amounts in crores', () => {
    expect(formatCurrency(50000000)).toBe('₹5.00 Cr')
  })
})
```

---

## Spring Boot Tests (JUnit 5 + Mockito)

### Location
```
backend-java/src/test/java/com/leadrat/crm/
├── auth/
│   └── AuthControllerTest.java
├── lead/
│   └── LeadControllerTest.java
└── activity/
    └── ActivityControllerTest.java
```

### Running Tests

```bash
cd backend-java

# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=AuthControllerTest

# Run with coverage
./mvnw test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

### Test Coverage

- ✅ **Authentication**: Login success/failure, invalid credentials, empty fields
- ✅ **Leads API**: GET /leads with pagination, filtering, role-based access
- ✅ **Activities API**: Create/update activities, status filtering, pagination

### Example Tests

```java
@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {
  @Test
  void shouldLoginSuccessfully() throws Exception {
    mockMvc.perform(post("/api/v1/auth/login")
      .contentType(MediaType.APPLICATION_JSON)
      .content(requestBody))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.success").value(true))
      .andExpect(jsonPath("$.data.accessToken").exists())
  }

  @Test
  void shouldFailLoginWithInvalidPassword() throws Exception {
    mockMvc.perform(post("/api/v1/auth/login")
      .contentType(MediaType.APPLICATION_JSON)
      .content(requestBody))
      .andExpect(status().isUnauthorized())
  }
}
```

---

## FastAPI Tests (pytest + unittest.mock)

### Location
```
backend-ai/
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Test fixtures
│   ├── test_webhook.py       # Engageto webhook tests
│   ├── test_intent_classifier.py  # Intent classification tests
│   └── test_orchestrator.py  # LangGraph orchestrator tests
└── pytest.ini
```

### Running Tests

```bash
cd backend-ai

# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_webhook.py

# Run with coverage
pytest --cov=app --cov-report=html

# View coverage report
open htmlcov/index.html
```

### Test Coverage

- ✅ **Webhook**: Valid/invalid signatures, duplicate messages, media handling
- ✅ **Intent Classifier**: All 12 intent categories, entity extraction, confidence scores
- ✅ **Orchestrator**: End-to-end message flow, site visit booking, human handoff, fallback handling

### Example Tests

```python
# Webhook Test
@pytest.mark.asyncio
async def test_webhook_valid_payload(client, sample_webhook_payload):
    with patch('app.services.engageto.verify_webhook_signature', return_value=True):
        response = client.post(
            "/webhook/whatsapp",
            json=sample_webhook_payload,
            headers={"X-Engageto-Signature": "valid-signature"}
        )
    assert response.status_code == 200

# Intent Classifier Test
@pytest.mark.asyncio
async def test_classify_site_visit_booking():
    message = "I'd like to schedule a site visit tomorrow at 2 PM"
    
    mock_response = {
        "intent": "site_visit_booking",
        "confidence": 0.94,
        "entities": {"visit_date": "tomorrow", "visit_time": "2 PM"}
    }
    
    with patch('app.agents.intent_router.llm_classify', return_value=mock_response):
        result = await classify_intent(message)
    
    assert result["intent"] == "site_visit_booking"

# Orchestrator Test
@pytest.mark.asyncio
async def test_orchestrator_handoff_trigger():
    message = "This is frustrating! I need to speak to someone now!"
    
    with patch('app.agents.intent_router.classify_intent', return_value=handoff_intent):
        result = await process_message(
            whatsapp_number="919876543210",
            message=message,
            tenant_id="tenant-123"
        )
    
    assert result.get("should_handoff") == True
```

---

## Test Fixtures & Mocks

### Frontend (Jest + @testing-library)

```typescript
// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock API calls
jest.mock('@/lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}))
```

### Spring Boot (Mockito)

```java
@SpringBootTest
@AutoConfigureMockMvc
class TestClass {
  @Autowired
  private MockMvc mockMvc;  // HTTP request simulation
  
  @MockBean
  private SomeService someService;  // Mock dependencies
  
  @WithMockUser(roles = "ADMIN")  // Mock auth
  void testProtectedEndpoint() { }
}
```

### FastAPI (unittest.mock)

```python
@pytest.fixture
def client():
    from app.main import app
    return TestClient(app)

@pytest.mark.asyncio
async def test_something(client):
    with patch('app.services.leadrat_auth.LeadratAuthService') as mock:
        response = client.post("/webhook/whatsapp", json={...})
```

---

## Test Statistics

### Frontend
- **Files Tested**: 6 (components, hooks, utilities)
- **Test Count**: 25+
- **Coverage Target**: 80%+

### Spring Boot
- **Files Tested**: 3 (controllers)
- **Test Count**: 18+
- **Coverage Target**: 75%+

### FastAPI
- **Files Tested**: 3 (webhook, intent, orchestrator)
- **Test Count**: 22+
- **Coverage Target**: 70%+

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with: { node-version: '18' }
      - run: cd frontend && npm install && npm test

  backend-java:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-java@v2
        with: { java-version: '17' }
      - run: cd backend-java && ./mvnw test

  backend-ai:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with: { python-version: '3.11' }
      - run: cd backend-ai && pip install -r requirements.txt && pytest
```

---

## Best Practices

1. **Isolation**: Each test should be independent
2. **Mocking**: Mock external dependencies (APIs, databases)
3. **Clarity**: Test names should describe what they test
4. **Coverage**: Aim for 80%+ code coverage
5. **Async Tests**: Use `@pytest.mark.asyncio` for FastAPI async functions
6. **Integration Tests**: Separate unit tests from integration tests

---

## Troubleshooting

### Frontend Tests Fail
```bash
# Clear Jest cache
npm test -- --clearCache

# Reinstall dependencies
rm -rf node_modules && npm install
```

### Spring Boot Tests Fail
```bash
# Clear Maven cache
./mvnw clean

# Rebuild
./mvnw clean test
```

### FastAPI Tests Fail
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run with debug output
pytest -v -s
```

---

**Status**: ✅ **Part 10 - Complete Testing Suite DONE**

All tests are production-ready and can be run locally or in CI/CD pipelines.
