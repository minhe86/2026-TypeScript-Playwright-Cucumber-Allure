Feature: API scenario isolation

  Scenario: Create a client and a user
    Given User gets an authorization token
    And User creates a resource client
    When User creates a new user resource with name "First" and email "first@example.test"
    Then The user resource should be created successfully
    When User retrieves the user resource by ID
    Then The user resource details should match name "Michael" and email "michael.lawson@reqres.in"

  Scenario: A client from another scenario cannot be reused
    When User creates a new user resource with name "Second" and email "second@example.test"

  Scenario: A creation response from another scenario cannot be reused
    Then The user resource should be created successfully

  Scenario: A retrieval response from another scenario cannot be reused
    Then The user resource details should match name "Michael" and email "michael.lawson@reqres.in"
