const { PrismaClient } = require("@prisma/client");
const foods = require("../src/data/foods.json");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding food options...");
  for (const food of foods) {
    await prisma.foodOption.upsert({
      where: { id: food.id },
      update: food,
      create: food,
    });
  }
  console.log(`Seeded ${foods.length} food options.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
