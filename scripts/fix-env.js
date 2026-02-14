
const fs = require('fs');
const content = `GEMINI_API_KEY=AIzaSyDE85E7w8po2ohKmofmAMfJfyvWEb9yao4
TELEGRAM_BOT_TOKEN=8486554034:AAFMApxgneQ6XsPp4OiF3l5p8_5eLjYpmDU
TELEGRAM_OWNER_ID=8539603941
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BDLpqOLsZKa95Q_arI5u4EFvPRlvsvEw65w1fEpeKBps9bvGoLeM24a0BceEhyOaARDp-ivlfOiHS5MZ_t2NHcI"
VAPID_PRIVATE_KEY="7Vc5AWUL4JbJqflYF_YvVunzcgTk83vIRVeMJHCLFBo"
`;
fs.writeFileSync('.env.local', content, { encoding: 'utf8' });
console.log('.env.local created with UTF-8 encoding');
