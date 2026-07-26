import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function getArgument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
      reject(new Error("Cette commande doit etre lancee dans un terminal interactif."));
      return;
    }

    const characters = [];
    const input = process.stdin;

    const cleanup = () => {
      input.off("data", onData);
      input.setRawMode(false);
      input.pause();
    };

    const onData = (chunk) => {
      for (const character of String(chunk)) {
        if (character === "\u0003") {
          cleanup();
          process.stdout.write("\n");
          reject(new Error("Operation annulee."));
          return;
        }

        if (character === "\r" || character === "\n") {
          cleanup();
          process.stdout.write("\n");
          resolve(characters.join(""));
          return;
        }

        if (character === "\u007f" || character === "\b") {
          characters.pop();
          continue;
        }

        if (character >= " ") {
          characters.push(character);
        }
      }
    };

    process.stdout.write(prompt);
    input.setEncoding("utf8");
    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
  });
}

function validatePassword(password) {
  if (password.length < 12 || password.length > 72) {
    return "Le mot de passe doit contenir entre 12 et 72 caracteres.";
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Le mot de passe doit contenir au moins une lettre et un chiffre.";
  }

  return null;
}

async function main() {
  const email = getArgument("--email")?.trim().toLowerCase();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("Utilisation : npm run admin:create -- --email admin@exemple.ma");
  }

  const existingAdmin = await prisma.adminUser.findUnique({ where: { email } });
  if (existingAdmin) {
    throw new Error("Un compte administrateur existe deja avec cet e-mail.");
  }

  const password = await readHidden("Mot de passe admin : ");
  const confirmation = await readHidden("Confirmer le mot de passe : ");

  if (password !== confirmation) {
    throw new Error("Les mots de passe ne correspondent pas.");
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    throw new Error(passwordError);
  }

  await prisma.adminUser.create({
    data: {
      email,
      passwordHash: await hash(password, 12),
      role: "admin",
    },
  });

  console.log(`Compte administrateur cree : ${email}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
