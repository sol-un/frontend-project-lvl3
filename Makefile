install:
	npm ci
build:
	@ NODE_ENV=production npm run build
lint:
	@ npx eslint .
develop:
	@ npm run start:dev
test:
	@ npm test

.PHONY: test
