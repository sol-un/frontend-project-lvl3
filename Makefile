build:
	@ rm -rf dist && npx webpack
develop:
	@ npx webpack serve
lint:
	@ npx eslint .
test:
	@ npm test

.PHONY: test