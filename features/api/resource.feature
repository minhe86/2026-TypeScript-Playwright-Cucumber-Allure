@api
Feature: API - Get token and verify users and register resource and status code.

  Background: Get test token and client ready.
    Given User gets an authorization token
    Given User creates a resource client

  Scenario: Create and retrieve a user resource
    When User creates a new user resource with name "Michael" and email "michael.lawson@reqres.in"
    Then The user resource should be created successfully
    When User retrieves the user resource by ID
    Then The user resource details should match name "Michael" and email "michael.lawson@reqres.in"

  Scenario: Attempt to create a register resource with invalid data
    When User attempts to create a register resource with invalid data
    Then The register API should return a 400 error
