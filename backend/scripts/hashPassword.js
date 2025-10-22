import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('--- Password Hash Generator ---');
rl.question('Enter the password to hash: ', (password) => {
  if (!password) {
    console.error('Password cannot be empty.');
    rl.close();
    return;
  }

  const saltRounds = 10;
  const hash = bcrypt.hashSync(password, saltRounds);

  console.log('\n✅ Bcrypt Hash Generated Successfully:\n');
  console.log(hash);
  rl.close();
});