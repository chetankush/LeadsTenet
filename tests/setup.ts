// Ensure the AI service singleton can construct during tests (the SDK itself is
// mocked in the service test).
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-key'
