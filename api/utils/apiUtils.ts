export function validateStatusCode(response: { status: number }, expectedStatus: number) {
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, but got ${response.status}`);
    }
  }