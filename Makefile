build:
	@ NODE_ENV=production npm run build
lint:
	@ npx eslint .
develop:
	@ NODE_ENV=development npm run start:dev
test:
	@ npm test

.PHONY: test
