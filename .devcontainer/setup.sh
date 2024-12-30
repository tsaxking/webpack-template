if [ ! -f ".env" ]; then
	echo "No .env file found, using template."
	cp .devcontainer/env.template .env
fi

echo "Installing dependencies via PNPM..."
pnpm i

if grep -q "TBA_KEY = ''" .env; then
	echo "YOU DO NOT HAVE A TBA KEY!"
	echo "PLEASE ADD A TBA KEY!"
fi