TESTS = test/*.js
test:
	TestEnv=true mocha --timeout 5000 $(TESTS)

.PHONY: test
