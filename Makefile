build:
	@ NODE_ENV=production npm run build
lint:
	@ npx eslint .
develop:
	@ npm run start:dev
deploy:
	@ make build && git commit -am "Latest prod build" && git push
test:
	@ npm test

.PHONY: test
