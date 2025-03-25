// vercel-build.js
const { exec } = require('child_process');

exec('npx prisma generate', (err, stdout, stderr) => {
  if (err) {
    console.error(`Prisma generate error: ${stderr}`);
    process.exit(1);
  } else {
    console.log(`Prisma generate output: ${stdout}`);
  }
});
