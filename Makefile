build:
	@ rm -rf dist && npx webpack
develop:
	@ npx webpack serve