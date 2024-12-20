if [ ! -f ".env" ]; then
	echo "No .env file found, using template."
	cp .devcontainer/env.template .env
fi

echo "Installing dependencies via NPM..."
npm i

if grep -q "TBA_KEY = ''" .env; then
	echo "\033[31mWARNING!\033[0m \033[33mYOU DO NOT HAVE A TBA KEY!\033[0m"
	echo "\033[31mWARNING!\033[0m \033[33mPLEASE ADD A TBA KEY!\033[0m"
fi