set -euo pipefail
printf "Network (polygon/amoy) [polygon]: "
read NETWORK
NETWORK=${NETWORK:-polygon}
printf "Token contract address (0x... 42 chars): "
read TOKEN
[[ $TOKEN =~ ^0x[0-9a-fA-F]{40}$ ]] || { echo "Invalid token"; exit 1; }
printf "New owner address (0x... 42 chars): "
read NEWOWNER
[[ $NEWOWNER =~ ^0x[0-9a-fA-F]{40}$ ]] || { echo "Invalid new owner"; exit 1; }
printf "Current owner private key (hidden, 0x + 64 hex): "
read -s PK
echo
[[ $PK =~ ^0x[0-9a-fA-F]{64}$ ]] || { echo "Invalid private key"; exit 1; }
export PRIVATE_KEY="$PK"
npx hardhat run scripts/transferOwnership.js --network "$NETWORK" --token "$TOKEN" --new "$NEWOWNER"
unset PRIVATE_KEY
